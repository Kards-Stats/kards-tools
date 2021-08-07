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
  ticket: string
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

  constructor (type: string, connector: SteamAccountConnector) {
    logger.info(`Generating session for ${type}`)
    this.scheduler = new ToadScheduler()
    this.heartbeatTask = undefined
    this.heartbeatJob = undefined
    this.session = undefined
    this.type = type
    this.connector = connector
    this.authenticating = false
  }

  private stopHeartbeat (): void {
    if (this.heartbeatJob !== undefined) {
      this.heartbeatJob.stop()
      this.heartbeatJob = undefined
    }
    if (this.heartbeatTask !== undefined) {
      this.heartbeatTask = undefined
    }
  }

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
            'Drift-Api-Key': process.env.kards_drift_api_key
          }, `/players/${this.session.player_id}/heartbeat`).then((result) => {
            if (_.isObject(result) && Object.hasOwnProperty.call(result, 'last_heartbeat')) {
              if (this.session !== undefined) {
                this.session.last_heartbeat = result.last_heartbeat
                return deferred.resolve()
              } else {
                logger.error('No session after result')
                this.scheduler.stop()
                return deferred.reject('No session after result')
              }
            } else {
              logger.error('No heartbeat result')
              this.scheduler.stop()
              return deferred.reject('No heartbeat result')
            }
          }).catch((e) => {
            logger.error(e)
            if (e.status_code === 401) { this.session = undefined }
            this.scheduler.stop()
            return deferred.reject(e)
          })
        } else {
          this.scheduler.stop()
          return Promise.resolve()
        }
        return deferred.promise as any as Promise<void>
      },
      (e) => {
        logger.error(e)
      }
    )
    this.heartbeatJob = new SimpleIntervalJob({ seconds: 30 }, this.heartbeatTask)
    this.scheduler.addSimpleIntervalJob(this.heartbeatJob)
    return true
  }

  async getJti (): Promise<string> {
    const deferred = Q.defer()
    this.getSession().then((session) => {
      // logger.debug(session);
      return deferred.resolve(session.jti)
    }).catch((e) => {
      logger.error(e)
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
      logger.error(e)
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<string>
  }

  async getSession (tryNum = 0, username = 'oldest'): Promise<SessionType> {
    logger.silly(`getSession(${tryNum}, ${username})`)
    if (tryNum > 3) {
      return await Promise.reject(new Error('max retries'))
    }
    if (this.needsNewSession()) {
      logger.silly('new session needed')
      if (this.authenticating) {
        logger.silly('Already authenticating')
        await this.waitForAuthentication()
        var steamUser = await this.getInternalUser(username)
        return await this.getSession(tryNum + 1, steamUser?.username ?? 'oldest')
      } else {
        this.authenticating = true
        try {
          steamUser = await this.getInternalUser(username)
          if (steamUser === undefined) {
            return await this.getSession(tryNum + 1)
          }
          var endpoint = await getKardsSessionEndpoint()
          logger.silly('endpoint: ' + endpoint)
          var postData = JSON.stringify({
            provider: 'steam',
            provider_details: {
              steam_id: steamUser.steam_id,
              ticket: steamUser.ticket,
              appid: process.env.kards_app_id
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
            result = await publicPost(getPath(endpoint), postData)
          } catch (e) {
            console.log(e)
            if (e instanceof KardsApiError && e.status_code === 401) {
              var banned = false
              if (e.message.toLowerCase().includes('disabled')) {
                // Account Banned
                banned = true
              }
              // Possible steam auth timeout
              await this.connector.setBanned(steamUser.username, banned)
              this.steamUser = undefined
              this.authenticating = false
              return await this.getSession(tryNum + 1)
            } else {
              logger.silly('Kards session error')
              throw e
            }
          }
          await this.connector.addKardsLogin(steamUser.username)
          if (_.isObject(result)) {
            this.session = result as SessionType
            this.startHeartbeat()
            this.authenticating = false
            return this.session
          }
          throw new Error('Result isnt object')
        } finally {
          this.authenticating = false
        }
      }
    } else {
      logger.silly('already have session')
      if (this.session === undefined) { throw new Error('Session invalidated before it was returned') }
      return this.session
    }
  }

  async getInternalUser (fallback = 'oldest'): Promise<InternalSteamUser | undefined> {
    if (this.steamUser === undefined) {
      this.authenticating = true
      var steamUser = await this.getUser(fallback)
      if (steamUser === null) {
        this.authenticating = false
        throw new Error('No more steam accounts to use')
      }
      if (steamUser.ticket === undefined || steamUser.steam_id === undefined) {
        logger.silly('steam values empty')
        try {
          await this.refreshSteam(steamUser.username)
        } finally {
          this.authenticating = false
        }
      } else {
        this.steamUser = {
          username: steamUser.username,
          steam_id: steamUser.steam_id,
          ticket: steamUser.ticket
        }
      }
      this.authenticating = false
      return this.steamUser
    } else {
      return this.steamUser
    }
  }

  async getUser (username = 'oldest'): Promise<SteamUserType | null> {
    if (username === 'oldest') {
      return await this.connector.getOldest(this.type)
    } else {
      return await this.connector.getUser(username)
    }
  }

  async waitForAuthentication (timeout: number = 30): Promise<void> {
    if (!this.authenticating) {
      return
    }
    var tries: number = 0
    while (this.authenticating) {
      if (tries >= timeout) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      tries += 1
    }
  }

  needsNewSession (): boolean {
    logger.silly('needsNewSession')
    if (this.session === undefined) {
      logger.silly('no session')
      return true
    } else {
      if (Object.hasOwnProperty.call(this.session, 'last_heartbeat')) {
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

  async refreshSteam (username: string): Promise<string> {
    logger.silly(`refreshSteam(${username})`)
    const deferred = Q.defer()
    this.steamUser = undefined

    this.connector.getUser(username).then((steamUser: SteamUserType | null) => {
      if (steamUser == null) {
        return deferred.reject(new Error('No steam user found'))
      }
      const timeSinceLogin = (new Date()).getTime() - steamUser.last_steam_login.getTime()
      if (timeSinceLogin <= tenMinutes) {
        // Login less than 10 minutes ago, dont refresh to avoid limit bans
        return deferred.resolve('')
      }
      var steam = new SteamUser()

      steam.on('steamGuard', () => {
        logger.error(`Steam guard left on for user ${steamUser.username}`)
        return deferred.reject(`Steam guard left on for user ${steamUser.username}`)
      })

      logger.silly(steamUser.username)
      logger.silly(steamUser.password)
      steam.logOn({
        accountName: steamUser.username,
        password: steamUser.password,
        logonID: randU32Sync()
      })

      steam.on('loggedOn', (details: any) => {
        logger.silly('loggedOn')
        // logger.debug(details);
        // steamId = details.client_supplied_steamid;
        /*
                steam.gamesPlayed({
                    game_id: 544810,
                    game_extra_info: 'Kards Virtual'
                });
                */
        steam.getAuthSessionTicket(process.env.kards_app_id, (err: any, ticket: any) => {
          logger.silly('getAuthSessionTicket')
          if (err !== undefined && err !== null) { return deferred.reject(err) }
          this.connector.addSteamLogin(
            steamUser.username,
            details.client_supplied_steamid,
            ticket.toString('hex'))
            .then(() => {
              this.steamUser = {
                username: steamUser.username,
                steam_id: details.client_supplied_steamid,
                ticket: ticket.toString('hex')
              }
              return deferred.resolve(ticket.toString('hex'))
            }).catch((e) => {
              return deferred.reject(e)
            })
        })
      })

      steam.on('error', function (error: any) {
        return deferred.reject(error)
      })
    }).catch((e) => {
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<string>
  }
}
