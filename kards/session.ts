import Q from 'q'
import KardsApiError from './kards-api-error'
import { LoginReward, Session as SessionType } from '../types/kards-backend'
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler'
import { SteamAccountConnector } from '../connectors/types'
import { SteamUser as SteamUserType, Keyable } from '../types/backend'
import SteamUser from 'steam-user'
import { DRIFT_API_KEY, HOSTNAME, APP_ID } from './defaults'
import { Debugger } from '../includes'
import Requester from './request'
import { Home } from './sub'

const tenMinutes: number = 10 * 60 * 60 * 1000

function getRandomInt (min: number = 0, max: number = 2147483647): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface InternalSteamUser {
  username: string
  steam_id: string
  ticket?: string
}

export default class Session {
  public scheduler: ToadScheduler
  public heartbeatTask?: AsyncTask
  public heartbeatJob?: SimpleIntervalJob
  public session?: SessionType
  public type: string
  public connector: SteamAccountConnector
  public authenticating: boolean
  public steamUser?: InternalSteamUser
  public steamUserObject?: any
  public kardsAppId: string
  public driftApiKey: string
  public hostname: string
  public logger: Debugger

  constructor (type: string, connector: SteamAccountConnector, logger?: Debugger, driftApiKey: string = DRIFT_API_KEY, kardsAppId: string = APP_ID, hostname: string = HOSTNAME) {
    this.logger = logger ?? new Debugger()
    this.logger.silly(`Generating session for ${type}`)
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
    this.hostname = hostname
    this.steamUserObject = new SteamUser()
    this.steamUserObject.storage.on('save', (filename: string, contents: Buffer, callback: (err: any | null) => void) => {
      connector.saveFile(filename, contents).then(() => {
        callback(null)
      }).catch((e) => {
        /* istanbul ignore next */
        callback(e)
      })
    })
    this.steamUserObject.storage.on('read', (filename: string, callback: (err: any, buffer: Buffer | null) => void) => {
      connector.readFile(filename).then((contents) => {
        callback(null, contents)
      }).catch((e) => {
        /* istanbul ignore next */
        callback(e, null)
      })
    })
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
        if (this.session !== undefined) {
          try {
            const result = await Requester.rawRequest('PUT', `/players/${this.session.player_id}/heartbeat`, {
              Authorization: 'JWT ' + this.session.jwt
            }, undefined, this.logger, this.hostname, this.driftApiKey)
            if (!Array.isArray(result) && typeof result === 'object' && Object.hasOwnProperty.call(result, 'last_heartbeat')) {
              if (this.session !== undefined) {
                this.session.last_heartbeat = result.last_heartbeat
                return
              } else {
                this.logger.warn('Heartbeat no session after result')
                try {
                  await this.stopSession()
                  this.stopHeartbeat()
                } catch (e) {
                  this.logger.warn('Stop session in heartbeat error')
                  this.logger.warn(e)
                }
                throw new Error('No session after result')
              }
            } else {
              this.logger.warn('No heartbeat result')
              try {
                await this.stopSession()
                this.stopHeartbeat()
              } catch (e) {
                this.logger.warn('Stop session in heartbeat error')
                this.logger.warn(e)
              }
              throw new Error('No heartbeat result')
            }
          } catch (e) {
            this.logger.warn('Heartbeat request error')
            if (e.status_code === 401) { this.session = undefined }
            try {
              await this.stopSession()
              this.stopHeartbeat()
            } catch (e) {
              this.logger.warn('Stop session in heartbeat error')
              this.logger.warn(e)
            }
            throw e
          }
        } else {
          this.stopHeartbeat()
          return await this.stopSession()
        }
      },
      (e) => {
        this.logger.warn('Heartbeat error')
        this.logger.warn(e)
        this.stopSession().catch((e) => {
          this.logger.warn('Stop session in heartbeat error error')
          this.logger.warn(e)
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
      await Requester.rawRequest('DELETE', `/players/${this.session.player_id}/heartbeat`, {
        Authorization: 'JWT ' + this.session.jwt
      }, undefined, this.logger, this.hostname, this.driftApiKey)
    } catch (e) {
      this.logger.info(e)
    }
    this.session = undefined
  }

  public async getValue (key: keyof SessionType): Promise<string | number | boolean | string[] | LoginReward | null | undefined> {
    const session = await this.getSession()
    return session[key]
  }

  async getJti (): Promise<string> {
    const value = await this.getValue('jti')
    if (typeof value !== 'string') {
      /* istanbul ignore next */
      throw new Error('Invalid JTI response')
    }
    return value
  }

  async getPlayerID (): Promise<number> {
    const value = await this.getValue('player_id')
    if (typeof value !== 'number') {
      /* istanbul ignore next */
      throw new Error('Invalid JTI response')
    }
    return value
  }

  async getSession (tryNum = 0, username = 'oldest', skipAuthCheck: boolean = false): Promise<SessionType> {
    this.logger.silly(`getSession(${tryNum}, ${username})`)
    if (tryNum > 3) {
      throw new Error('max retries')
    }
    if (this.session === undefined || this.needsNewSession()) {
      this.logger.silly('new session needed')
      if (this.authenticating && !skipAuthCheck) {
        this.logger.silly('Already authenticating')
        await this.waitForAuthentication()
        var session = await this.getSession(tryNum + 1, username)
        return session
      } else {
        this.authenticating = true
        try {
          var steamUser = await this.getInternalUser(username)
          var request = new Requester(this.logger)
          request.driftApiKeyDefault = this.driftApiKey
          request.hostnameDefault = this.hostname
          var endpoint = await Home.getSessionEndpoint(this.logger, request)
          this.logger.silly('endpoint: ' + endpoint)
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
            result = await Requester.rawRequest('POST', Requester.getPath(endpoint, this.logger, this.hostname), undefined, postData, this.logger, this.hostname, this.driftApiKey)
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
              return session
            } else {
              this.logger.silly('Kards session error')
              this.authenticating = false
              throw e
            }
          }
          await this.connector.addKardsLogin(steamUser.username)
          if (typeof result === 'object') {
            this.session = result as SessionType
            this.startHeartbeat()
            this.authenticating = false
            return this.session
          }
          /* istanbul ignore next */
          throw new Error('Result isnt object')
        } finally {
          this.authenticating = false
        }
      }
    } else {
      this.logger.silly('already have session')
      return this.session
    }
  }

  async getInternalUser (fallback = 'oldest'): Promise<InternalSteamUser> {
    if (this.steamUser === undefined) {
      var steamUser = await this.getUser(fallback)
      if (steamUser === null) {
        throw new Error('No more steam accounts to use')
      }
      if (steamUser.ticket === undefined || steamUser.ticket === '' || steamUser.steam_id === undefined || steamUser.steam_id === '') {
        this.logger.silly('steam values empty')
        try {
          var tempUser = await this.refreshSteam(steamUser.username)
          if (tempUser === null) {
            if (fallback !== 'oldest') {
              await this.connector.addSteamLogin(steamUser.username, steamUser.steam_id ?? '', steamUser.ticket ?? '')
              return await this.getInternalUser('oldest')
            }
            throw new Error('Refresh Steam returned null')
          }
          this.steamUser = tempUser
        } catch (e) {
          this.logger.warn(e)
          if (fallback !== 'oldest') {
            await this.connector.addSteamLogin(steamUser.username, steamUser.steam_id ?? '', steamUser.ticket ?? '')
            return await this.getInternalUser('oldest')
          }
          throw e
        }
      } else {
        /* istanbul ignore next */
        this.steamUser = {
          username: steamUser.username,
          steam_id: steamUser.steam_id,
          ticket: steamUser.ticket
        }
      }
      // if (this.steamUser === undefined) {
      /* istanbul ignore next */
      // throw new Error('Session steam user has been corrupted before return')
      // } // else if (this.steamUser.ticket === undefined) {
      /* istanbul ignore next */
      // throw new Error('Session steam user has not been able to get ticket before return')
      // }
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

  needsNewSession (): boolean {
    this.logger.silly('needsNewSession')
    if (this.session === undefined) {
      this.logger.silly('no session')
      return true
    } else {
      if (Object.hasOwnProperty.call(this.session, 'last_heartbeat') &&
        this.session.last_heartbeat !== undefined) {
        this.logger.silly('has last_heartbeat')
        var lastHeartbeat = new Date(Date.parse(this.session.last_heartbeat))
        if (lastHeartbeat.getTime() + (1000 * 60) > Date.now()) {
          this.logger.silly('less than 60 seconds')
          // less than 60 seconds since heartbeat
          return false
        } else {
          return true
        }
      } else {
        this.logger.silly('no last_heartbeat')
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

  async refreshSteam (username: string, force: boolean = false, waitTime: number = tenMinutes): Promise<InternalSteamUser | null> {
    this.logger.silly(`refreshSteam(${username}, ${force ? 'true' : 'false'}, ${waitTime})`)
    var steamUser = await this.connector.getUser(username)
    if (steamUser === null) {
      throw new Error('No steam user found')
    }
    const timeSinceLogin = (new Date()).getTime() - steamUser.last_steam_login.getTime()
    if (timeSinceLogin <= waitTime) {
      // Login less than 10 minutes ago, dont refresh to avoid limit bans
      return null
    }
    var internalUser: InternalSteamUser = await this.login(steamUser, force)
    var ticket = await this.getSteamTicket()
    await this.connector.addSteamLogin(internalUser.username, internalUser.steam_id, ticket)
    this.steamUser = {
      username: internalUser.username,
      steam_id: internalUser.steam_id,
      ticket
    }
    return this.steamUser
  }

  async getSteamTicket (): Promise<string> {
    this.logger.silly('getSteamTicket()')
    const deferred = Q.defer()
    if (!this.isLoggedIn() || this.steamUser === undefined) {
      throw new Error('Need to be logged in first')
    }
    this.steamUserObject.gamesPlayed({
      game_id: 544810,
      game_extra_info: 'Kards Virtual'
    })
    this.steamUserObject.getAuthSessionTicket(this.kardsAppId, (err: any, ticket: any) => {
      this.logger.silly('getAuthSessionTicket')
      if (err !== undefined && err !== null) { return deferred.reject(err) }
      if (this.steamUser !== undefined) {
        this.steamUser.ticket = ticket.toString('hex')
      }
      return deferred.resolve(ticket.toString('hex'))
    })

    this.steamUserObject.once('error', (error: any) => {
      this.steamUserObject.removeAllListeners('error')
      return deferred.reject(error)
    })
    return await (deferred.promise as any as Promise<string>)
  }

  async waitForAccountInfo (): Promise<void> {
    this.logger.silly('waitForAccountInfo()')
    if (this.steamUserObject === undefined) {
      throw new Error('waitForAccountInfo steamUserObject undefined')
    }
    if (this.steamUserObject.accountInfo !== undefined &&
      this.steamUserObject.accountInfo !== null) {
      return
    }
    return await new Promise<void>((resolve, reject) => {
      var called = false
      var handler = (): void => {
        called = true
        clearTimeout(timer)
        return resolve()
      }
      var timer = setTimeout(() => {
        this.steamUserObject.removeAllListeners(handler)
        if (this.steamUserObject?.accountInfo !== undefined &&
          this.steamUserObject?.accountInfo !== null) {
          return resolve()
        }
        if (!called) {
          return reject(new Error('waitForAccountInfo Timeout'))
        }
      }, 5)
      this.steamUserObject.once('accountInfo', handler)
    })
  }

  async login (steamUser: SteamUserType, relog: boolean = false, tryNumber: number = 0): Promise<InternalSteamUser> {
    this.logger.silly(`login(${JSON.stringify(steamUser)}, ${relog ? 'true' : 'false'})`)
    const deferred = Q.defer()
    if (tryNumber > 3) {
      /* istanbul ignore next */
      throw new Error('Max retries made')
    }
    if (this.isLoggedIn()) {
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
      this.steamUserObject.once('steamGuard', () => {
        this.logger.warn(`Steam guard left on for user ${steamUser.username}`)
        this.steamUserObject.removeAllListeners('error')
        this.steamUserObject.removeAllListeners('loggedOn')
        this.steamUserObject.removeAllListeners('steamGuard')
        return deferred.reject(`Steam guard left on for user ${steamUser.username}`)
      })
      this.steamUserObject.logOn({
        accountName: steamUser.username,
        password: steamUser.password,
        rememberPassword: true,
        logonID: getRandomInt()
      })
      this.steamUserObject.once('loggedOn', (details: any) => {
        this.waitForAccountInfo().then(() => {
          this.logger.silly('loggedOn')
          this.steamUser = {
            username: steamUser.username,
            steam_id: details.client_supplied_steamid
          }
          this.steamUserObject.removeAllListeners('error')
          this.steamUserObject.removeAllListeners('loggedOn')
          this.steamUserObject.removeAllListeners('steamGuard')
          return deferred.resolve(this.steamUser)
        }).catch((e) => {
          this.logger.warn(e)
          return deferred.reject(e)
        })
      })

      /* istanbul ignore next */
      this.steamUserObject.once('error', (error: any) => {
        this.logger.silly('steam login error')
        this.logger.warn(error)
        this.steamUserObject.removeAllListeners('error')
        this.steamUserObject.removeAllListeners('loggedOn')
        this.steamUserObject.removeAllListeners('steamGuard')
        this.login(steamUser, relog, tryNumber + 1).then((user) => {
          return deferred.resolve(user)
        }).catch((e) => {
          return deferred.reject(e)
        })
      })
    }
    return await (deferred.promise as any as Promise<InternalSteamUser>)
  }

  async logout (): Promise<void> {
    this.logger.silly('logout()')
    const deferred = Q.defer()
    if (!this.isLoggedIn()) {
      return
    }
    this.steamUserObject.once('disconnected', () => {
      this.steamUserObject.removeAllListeners('disconnected')
      return deferred.resolve()
    })
    this.steamUserObject.logOff()
    this.steamUserObject.accountInfo = undefined
    this.steamUser = undefined
    return await (deferred.promise as any as Promise<void>)
  }
}
