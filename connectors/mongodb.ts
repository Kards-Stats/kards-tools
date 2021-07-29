import { getCurrentLogger } from '../includes/logger'
import Q from 'q'
import mongoose from 'mongoose'
import winston from 'winston'
import { SteamAccountConnector } from './types'
import { SteamUser } from '../types/backend'

const logger: winston.Logger = getCurrentLogger('models-steam-user')

const Schema = mongoose.Schema

const RequiredString = {
  type: String,
  required: true
}

const SteamUserSchema = new Schema({
  username: RequiredString,
  password: RequiredString,
  type: RequiredString,
  steam_id: String,
  ticket: String,
  banned: {
    type: Boolean,
    default: false
  },
  last_steam_login: Date,
  last_kards_login: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

interface SteamUserDocument extends mongoose.Document {
  username: string
  password: string
  type: string
  steam_id?: string
  ticket?: string
  banned: boolean
  last_steam_login: Date
  last_kards_login: Date
}

export default class MongoDBSteamUserConnector implements SteamAccountConnector {
  SteamUserModel: mongoose.Model<SteamUserDocument>

  constructor (collectionName: string, connection: mongoose.Connection) {
    this.SteamUserModel = connection.model(collectionName, SteamUserSchema) as any as mongoose.Model<SteamUserDocument>
  }

  async addSteamUser (username: string, password: string, type: string): Promise<SteamUser | null> {
    const deferred = Q.defer()
    if (username === '' ||
      password === '' ||
      type === '') {
      return await Promise.reject(new Error('Empty arguments for addSteamUser'))
    }
    const date = new Date(0)
    const data: SteamUser = {
      username: username,
      password: password,
      type: type,
      banned: false,
      last_steam_login: date,
      last_kards_login: date
    }
    const model = new this.SteamUserModel(data)
    model.save().then((value) => {
      return deferred.resolve(this.formatSteamUser(value))
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  formatSteamUser (document: SteamUserDocument | null): SteamUser | null {
    if (document === null) {
      return null
    }
    return {
      username: document.username,
      password: document.password,
      type: document.type,
      steam_id: document.steam_id,
      ticket: document.ticket,
      banned: document.banned,
      last_steam_login: document.last_steam_login,
      last_kards_login: document.last_kards_login
    }
  }

  formatSteamUsers (documents: SteamUserDocument[]): Array<SteamUser | null> {
    var steamUsers: Array<SteamUser | null> = []
    for (var document of documents) {
      steamUsers.push(this.formatSteamUser(document))
    }
    return steamUsers
  }

  async getUnbanned (type = '*'): Promise<Array<SteamUser | null>> {
    logger.silly(`getUnbanned(${type})`)
    const deferred = Q.defer()
    const query = type !== '*' ? { type: type, banned: false } : { banned: false }
    this.SteamUserModel.find(query).then((results: SteamUserDocument[]) => {
      return deferred.resolve(this.formatSteamUsers(results))
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<Array<SteamUser | null>>
  }

  async getUser (user: string): Promise<SteamUser | null> {
    logger.silly(`getUser(${user})`)
    const deferred = Q.defer()
    const query = { username: user }
    this.SteamUserModel.findOne(query).then((result: SteamUserDocument | null) => {
      return deferred.resolve(this.formatSteamUser(result))
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  async getOldest (type = '*'): Promise<SteamUser | null> {
    logger.silly(`getOldest(${type})`)
    const deferred = Q.defer()
    const query = type !== '*' ? { type: type, banned: false } : { banned: false }
    this.SteamUserModel.findOne(query, null, { sort: { last_steam_login: 1 } }).then((result: SteamUserDocument | null) => {
      return deferred.resolve(this.formatSteamUser(result))
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  async addSteamLogin (user: string, steamId: string, ticket: string): Promise<SteamUser | null> {
    logger.silly(`addSteamLogin(${user}, ${steamId}, ${ticket})`)
    const deferred = Q.defer()
    const query = { username: user }
    this.SteamUserModel.findOne(query).then((result: SteamUserDocument | null) => {
      if (result === null) {
        return deferred.resolve(null)
      }
      result.last_steam_login = new Date()
      result.steam_id = steamId
      result.ticket = ticket
      result.save().then(() => {
        return deferred.resolve(this.formatSteamUser(result))
      }).catch((e) => {
        /* c8 ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  async setBanned (user: string, banned: boolean): Promise<SteamUser | null> {
    logger.silly(`setBanned(${user}, ${banned ? 'true' : 'false'})`)
    const deferred = Q.defer()
    const query = { username: user }
    this.SteamUserModel.findOne(query).then((result: SteamUserDocument | null) => {
      if (result === null) {
        return deferred.resolve(null)
      }
      result.banned = banned
      result.steam_id = undefined
      result.ticket = undefined
      result.save().then(() => {
        return deferred.resolve(this.formatSteamUser(result))
      }).catch((e) => {
        /* c8 ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  async addKardsLogin (user: string): Promise<SteamUser | null> {
    logger.silly(`addKardsLogin(${user})`)
    const deferred = Q.defer()
    const query = { username: user }
    this.SteamUserModel.findOne(query).then((result: SteamUserDocument | null) => {
      if (result === null) {
        return deferred.resolve(null)
      }
      result.last_kards_login = new Date()
      result.save().then(() => {
        return deferred.resolve(this.formatSteamUser(result))
      }).catch((e) => {
        /* c8 ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* c8 ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }
}
