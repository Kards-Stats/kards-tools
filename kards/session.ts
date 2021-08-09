import { getCurrentLogger } from '../includes/logger'
import Q from 'q'
import KardsApiError from './kards-api-error'
import { getKardsSessionEndpoint } from './endpoints'
import { Session as SessionType } from '../types/kards-backend'
import winston from 'winston'
import crypto from 'crypto'
import { publicPost, getPath, kardsRequest } from './kards-request'
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import _ from 'underscore'
import { SteamAccountConnector } from '../connectors/types'
import { SteamUser as SteamUserType, Keyable } from '../types/backend'
import SteamUser from 'steam-user'

const logger: winston.Logger = getCurrentLogger('includes-session')

const tenMinutes: number = 10 * 60 * 60 * 1000

function randU32Sync (): number {
  return crypto.randomBytes(4).readUInt32BE(0)
}

interface InternalSteamUser {
  username: string
  steam_id: string
  ticket?: string
}

export default class KardsSession {
  scheduler: ToadScheduler
  heartbeatTask: AsyncTask | undefined
  heartbeatJob: SimpleIntervalJob | undefined
  session: SessionType | undefined
  type: string
  connector: SteamAccountConnector
  authenticating: boolean
  steamUser?: InternalSteamUser
  steamUserObject?: any
  kardsAppId: string
  driftApiKey: string

  constructor (type: string, connector: SteamAccountConnector, driftApiKey: string = '1939-kards-5dcba429f:Kards 1.1.4835', kardsAppId: string = '544810') {
    logger.info(`Generating session for ${type}`)
    if (kardsAppId === '' || driftApiKey === '') {
      throw new Error('Invalid app id or drift api key')
    }
    this.scheduler = new ToadScheduler()
    this.heartbeatTask = undefined
    this.heartbeatJob = undefined
    this.session = undefined
    this.type = type
    this.connector = connector
    this.authenticating = false
    this.kardsAppId = kardsAppId
    this.driftApiKey = driftApiKey
    this.steamUserObject = new SteamUser()
  }

  /* istanbul ignore next */
  private stopHeartbeat (): void {
    if (this.heartbeatJob !== undefined) {
      this.heartbeatJob.stop()
      this.heartbeatJob = undefined
    }
    if (this.heartbeatTask !== undefined) {
      this.heartbeatTask = undefined
    }
  }

  /* istanbul ignore next */
  private startHeartbeat (): boolean {
    this.stopHeartbeat()
    if (this.session === undefined) { return false }
    this.heartbeatTask = new AsyncTask(
      `Heartbeat for ${this.session.player_id}`,
      async (): Promise<void> => {
        const deferred = Q.defer()
        if (this.session !== undefined) {
          kardsRequest('PUT', {
            'Content-Length': '0',
            Authorization: 'JWT ' + this.session.jwt,
            'Drift-Api-Key': this.driftApiKey
          }, `/players/${this.session.player_id}/heartbeat`).then((result) => {
            if (_.isObject(result) && Object.hasOwnProperty.call(result, 'last_heartbeat')) {
              if (this.session !== undefined) {
                this.session.last_heartbeat = result.last_heartbeat
                return deferred.resolve()
              } else {
                logger.warn('Heartbeat no session after result')
                this.stopHeartbeat()
                this.stopSession().then(() => {
                  return deferred.reject('No session after result')
                }).catch((e) => {
                  logger.warn('Stop session in heartbeat error')
                  logger.warn(e)
                  return deferred.reject('No session after result')
                })
              }
            } else {
              logger.warn('No heartbeat result')
              this.stopHeartbeat()
              this.stopSession().then(() => {
                return deferred.reject('No heartbeat result')
              }).catch((e) => {
                logger.warn('Stop session in heartbeat error')
                logger.warn(e)
                return deferred.reject('No heartbeat result')
              })
            }
          }).catch((e) => {
            logger.warn('Heartbeat request error')
            if (e.status_code === 401) { this.session = undefined }
            this.stopHeartbeat()
            this.stopSession().then(() => {
              return deferred.reject(e)
            }).catch(() => {
              logger.warn('Stop session in heartbeat error')
              logger.warn(e)
              return deferred.reject(e)
            })
          })
        } else {
          this.stopHeartbeat()
          return this.stopSession()
        }
        return deferred.promise as any as Promise<void>
      },
      (e) => {
        logger.warn('Heartbeat error')
        logger.warn(e)
        this.stopSession().catch((e) => {
          logger.warn('Stop session in heartbeat error error')
          logger.warn(e)
        })
        this.stopHeartbeat()
      }
    )
    this.heartbeatJob = new SimpleIntervalJob({ seconds: 30 }, this.heartbeatTask)
    this.scheduler.addSimpleIntervalJob(this.heartbeatJob)
    return true
  }

  async stopSession (): Promise<void> {
    this.stopHeartbeat()
    if (this.session === undefined) { return }
    if (this.needsNewSession()) {
      this.session = undefined
      return
    }
    try {
      await kardsRequest('DELETE', {
        'Content-Length': '0',
        Authorization: 'JWT ' + this.session.jwt,
        'Drift-Api-Key': this.driftApiKey
      }, `/players/${this.session.player_id}/heartbeat`)
    } catch (e) {
      logger.info(e)
    }
    this.session = undefined
  }

  async getJti (): Promise<string> {
    const deferred = Q.defer()
    this.getSession().then((session) => {
      // logger.debug(session);
      return deferred.resolve(session.jti)
    }).catch((e) => {
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<string>
  }

  async getPlayerID (): Promise<string> {
    const deferred = Q.defer()
    this.getSession().then((session) => {
      // logger.debug(session);
      return deferred.resolve(session.player_id)
    }).catch((e) => {
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<string>
  }

  async getSession (tryNum = 0, username = 'oldest', skipAuthCheck: boolean = false): Promise<SessionType> {
    logger.silly(`getSession(${tryNum}, ${username})`)
    // const deferred = Q.defer()
    if (tryNum > 3) {
      throw new Error('max retries')
    }
    if (this.session === undefined || this.needsNewSession()) {
      // process.nextTick(async () => {
      logger.silly('new session needed')
      if (this.authenticating && !skipAuthCheck) {
        logger.silly('Already authenticating')
        await this.waitForAuthentication()
        var session = await this.getSession(tryNum + 1, username)
        /* istanbul ignore next */
        return session
        // return deferred.resolve(session)
      } else {
        this.authenticating = true
        try {
          var steamUser = await this.getInternalUser(username)
          var endpoint = await getKardsSessionEndpoint(this.driftApiKey)
          logger.silly('endpoint: ' + endpoint)
          var postData = JSON.stringify({
            provider: 'steam',
            provider_details: {
              steam_id: steamUser.steam_id,
              ticket: steamUser.ticket,
              appid: this.kardsAppId
            },
            client_type: 'UE4',
            build: 'Kards 1.1.4233',
            platform_type: '',
            app_guid: 'Kards',
            version: '?',
            platform_info: '',
            platform_version: '',
            automatic_account_creation: true,
            username: `steam:${steamUser.steam_id ?? ''}`,
            password: `steam:${steamUser.steam_id ?? ''}`
          })
          let result: Keyable | string | undefined
          try {
            result = await publicPost(getPath(endpoint), postData, this.driftApiKey)
          } catch (e) {
            /* istanbul ignore else */
            if (e instanceof KardsApiError && e.status_code === 401) {
              var banned = false
              if (e.message.toLowerCase().includes('disabled')) {
                // Account Banned
                banned = true
              }
              // Possible steam auth timeout
              await this.connector.setBanned(steamUser.username, banned)
              this.steamUser = undefined
              session = await this.getSession(tryNum + 1, 'oldest', true)
              /* istanbul ignore next */
              // return deferred.resolve(this.session)
              return session
            } else {
              logger.silly('Kards session error')
              this.authenticating = false
              // return deferred.reject(e)
              throw e
            }
          }
          /* istanbul ignore next */
          await this.connector.addKardsLogin(steamUser.username)
          /* istanbul ignore next */
          if (_.isObject(result)) {
            this.session = result as SessionType
            this.startHeartbeat()
            this.authenticating = false
            // return deferred.resolve(this.session)
            return this.session
          }
          /* istanbul ignore next */
          // return deferred.reject(new Error('Result isnt object'))
          throw new Error('Result isnt object')
        } finally {
          this.authenticating = false
        }
        // catch (e) {
        // return deferred.reject(e)
        // }
      }
      // })
    } else {
      logger.silly('already have session')
      return this.session
    }
    // return await (deferred.promise as any as Promise<SessionType>)
  }

  async getInternalUser (fallback = 'oldest'): Promise<InternalSteamUser> {
    if (this.steamUser === undefined) {
      var steamUser = await this.getUser(fallback)
      if (steamUser === null) {
        throw new Error('No more steam accounts to use')
      }
      if (steamUser.ticket === undefined || steamUser.steam_id === undefined) {
        logger.silly('steam values empty')
        await this.refreshSteam(steamUser.username)
      } else {
        /* istanbul ignore next */
        this.steamUser = {
          username: steamUser.username,
          steam_id: steamUser.steam_id,
          ticket: steamUser.ticket
        }
      }
      if (this.steamUser === undefined) {
        /* istanbul ignore next */
        throw new Error('Session steam user has been corrupted before return')
      }
      return this.steamUser
    } else {
      return this.steamUser
    }
  }

  async getUser (username: string = 'oldest'): Promise<SteamUserType | null> {
    if (username === 'oldest') {
      return await this.connector.getOldest(this.type)
    } else {
      return await this.connector.getUser(username)
    }
  }

  /* istanbul ignore start */
  async waitForAuthentication (timeout: number = 30): Promise<void> {
    if (!this.authenticating) {
      /* istanbul ignore next */
      return
    }
    var tries: number = 0
    while (this.authenticating) {
      if (tries >= timeout) {
        /* istanbul ignore next */
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      tries += 1
    }
  }
  /* istanbul ignore end */

  needsNewSession (): boolean {
    logger.silly('needsNewSession')
    if (this.session === undefined) {
      logger.silly('no session')
      return true
    } else {
      if (Object.hasOwnProperty.call(this.session, 'last_heartbeat') &&
        this.session.last_heartbeat !== undefined) {
        logger.silly('has last_heartbeat')
        var lastHeartbeat = new Date(Date.parse(this.session.last_heartbeat))
        if (lastHeartbeat.getTime() + (1000 * 60) > Date.now()) {
          logger.silly('less than 60 seconds')
          // less than 60 seconds since heartbeat
          return false
        } else {
          return true
        }
      } else {
        logger.silly('no last_heartbeat')
        return true
      }
    }
  }

  isLoggedIn (): boolean {
    if (this.steamUserObject !== undefined) {
      if (this.steamUserObject.accountInfo !== undefined &&
        this.steamUserObject.accountInfo !== null) {
        return true
      }
    }
    return false
  }

  async refreshSteam (username: string, force: boolean = false, waitTime: number = tenMinutes): Promise<string> {
    logger.silly(`refreshSteam(${username})`)
    var steamUser = await this.connector.getUser(username)
    if (steamUser == null) {
      throw new Error('No steam user found')
    }
    const timeSinceLogin = (new Date()).getTime() - steamUser.last_steam_login.getTime()
    if (timeSinceLogin <= waitTime) {
      // Login less than 10 minutes ago, dont refresh to avoid limit bans
      /* istanbul ignore next */
      return ''
    }
    var internalUser: InternalSteamUser = await this.login(steamUser, force)
    var ticket = await this.getSteamTicket()
    await this.connector.addSteamLogin(internalUser.username, internalUser.steam_id, ticket)
    this.steamUser = {
      username: internalUser.username,
      steam_id: internalUser.steam_id,
      ticket
    }
    return ticket
  }

  async getSteamTicket (): Promise<string> {
    logger.silly('getSteamTicket()')
    const deferred = Q.defer()
    if (!this.isLoggedIn() || this.steamUser === undefined) {
      throw new Error('Need to be logged in first')
    }
    this.steamUserObject.gamesPlayed({
      game_id: 544810,
      game_extra_info: 'Kards Virtual'
    })
    this.steamUserObject.getAuthSessionTicket(this.kardsAppId, (err: any, ticket: any) => {
      logger.silly('getAuthSessionTicket')
      if (err !== undefined && err !== null) { return deferred.reject(err) }
      if (this.steamUser !== undefined) {
        this.steamUser.ticket = ticket.toString('hex')
      }
      return deferred.resolve(ticket.toString('hex'))
    })

    this.steamUserObject.on('error', function (error: any) {
      /* istanbul ignore next */
      return deferred.reject(error)
    })
    return deferred.promise as any as Promise<string>
  }

  async login (steamUser: SteamUserType, relog: boolean = false): Promise<InternalSteamUser> {
    logger.silly(`login(${JSON.stringify(steamUser)}, ${relog ? 'true' : 'false'})`)
    const deferred = Q.defer()
    if (this.isLoggedIn()) {
      /* istanbul ignore if */
      if (steamUser.username === this.steamUserObject.accountInfo.name) {
        if (relog) {
          await this.logout()
          this.login(steamUser, relog).then((user) => {
            return deferred.resolve(user)
          }).catch((e) => {
            /* istanbul ignore next */
            return deferred.reject(e)
          })
        } else {
          return this.steamUser ?? {
            username: this.steamUserObject.accountInfo.name,
            steam_id: this.steamUserObject.steamID
          }
        }
      } else {
        await this.logout()
        this.login(steamUser, relog).then((user) => {
          return deferred.resolve(user)
        }).catch((e) => {
          /* istanbul ignore next */
          return deferred.reject(e)
        })
      }
    } else {
      this.steamUserObject.on('steamGuard', () => {
        /* istanbul ignore next */
        logger.warn(`Steam guard left on for user ${steamUser.username}`)
        /* istanbul ignore next */
        return deferred.reject(`Steam guard left on for user ${steamUser.username}`)
      })
      this.steamUserObject.logOn({
        accountName: steamUser.username,
        password: steamUser.password,
        rememberPassword: true,
        logonID: randU32Sync()
      })
      this.steamUserObject.on('loggedOn', (details: any) => {
        logger.silly('loggedOn')
        this.steamUser = {
          username: steamUser.username,
          steam_id: details.client_supplied_steamid
        }
        return deferred.resolve(this.steamUser)
      })

      this.steamUserObject.on('error', function (error: any) {
        /* istanbul ignore next */
        return deferred.reject(error)
      })
    }
    return deferred.promise as any as Promise<InternalSteamUser>
  }

  async logout (): Promise<void> {
    logger.silly('logout()')
    const deferred = Q.defer()
    if (!this.isLoggedIn()) {
      return
    }
    this.steamUserObject.on('disconnected', () => {
      this.steamUserObject.on('disconnected', () => {})
      return deferred.resolve()
    })
    this.steamUserObject.logOff()
    this.steamUserObject.accountInfo = undefined
    this.steamUser = undefined
    return deferred.promise as any as Promise<void>
  }
}
