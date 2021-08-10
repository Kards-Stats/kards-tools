import { getCurrentLogger } from '../includes/logger'
import Q from 'q'
import mongoose from 'mongoose'
import winston from 'winston'
import { SteamAccountConnector } from './types'
import { SteamUser } from '../types/backend'
import stream from 'stream'
import mongodb from 'mongodb'

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

const SteamUserFileSchema = new Schema({
  filename: RequiredString,
  id: RequiredString
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
interface SteamUserFilesDocument extends mongoose.Document {
  filename: string
  id: string
}

export default class MongoDBSteamUserConnector implements SteamAccountConnector {
  SteamUserModel: mongoose.Model<SteamUserDocument>
  SteamUserFilesModel: mongoose.Model<SteamUserFilesDocument>
  bucket: mongodb.GridFSBucket

  constructor (collectionName: string, connection: mongoose.Connection) {
    if (connection === null || connection.readyState !== 1) {
      throw new Error('Connection doesnt exist or isnt ready')
    }
    this.SteamUserModel = connection.model(collectionName, SteamUserSchema) as any as mongoose.Model<SteamUserDocument>
    this.SteamUserFilesModel = connection.model(`${collectionName}_files`, SteamUserFileSchema) as any as mongoose.Model<SteamUserFilesDocument>
    this.bucket = new mongodb.GridFSBucket(connection.db, {
      bucketName: 'photos'
    })
  }

  async addSteamUser (username: string, password: string, type: string, overwrite: boolean = false): Promise<SteamUser | null> {
    if (username === '' ||
      password === '' ||
      type === '') {
      throw new Error('Empty arguments for addSteamUser')
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
    var value = await this.SteamUserModel.findOne({ username: username })
    if (value === null) {
      value = new this.SteamUserModel(data)
    } else {
      if (overwrite) {
        await value.overwrite(data)
      }
    }
    return await value.save()
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
      /* istanbul ignore next */
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
      /* istanbul ignore next */
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
      /* istanbul ignore next */
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
        /* istanbul ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* istanbul ignore next */
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
        /* istanbul ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* istanbul ignore next */
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
        /* istanbul ignore next */
        return deferred.reject(e)
      })
    }).catch((e) => {
      /* istanbul ignore next */
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<SteamUser | null>
  }

  async saveFile (filename: string, contents: Buffer): Promise<void> {
    const deferred = Q.defer()
    // Covert buffer to Readable Stream
    const readablePhotoStream = new stream.Readable()
    readablePhotoStream.push(contents)
    readablePhotoStream.push(null)
    const uploadStream = this.bucket.openUploadStream(filename)
    const id = uploadStream.id.toLocaleString()
    readablePhotoStream.pipe(uploadStream)
    uploadStream.on('error', () => {
      return deferred.reject(new Error('Error updating steam account file'))
    })
    uploadStream.on('finish', () => {
      this.SteamUserFilesModel.findOne({ filename: filename }).then((file) => {
        if (file === null) {
          file = new this.SteamUserFilesModel({
            filename: filename,
            id: id
          })
        } else {
          file.overwrite({
            filename: filename,
            id: id
          })
        }
        file.save().then(() => {
          return deferred.resolve()
        }).catch((e) => {
          return deferred.reject(e)
        })
      }).catch((e) => {
        return deferred.reject(e)
      })
    })
    /*
    var writestream = this.gridFS.createWriteStream({
      filename: filename
    })
    writestream.on('close', () => {
      return deferred.resolve()
    })
    writestream.on('error', (error) => {
      return deferred.reject(error)
    })
    var bufferStream = new stream.PassThrough()
    bufferStream.end(contents)
    bufferStream.pipe(writestream)
    */
    return deferred.promise as any as Promise<void>
  }

  async readFile (filename: string): Promise<Buffer | null> {
    const deferred = Q.defer()
    this.SteamUserFilesModel.findOne({ filename: filename }).then((file) => {
      if (file === null) {
        deferred.resolve(null)
      } else {
        try {
          var id = new mongodb.ObjectID(file.id)
        } catch (e) {
          return deferred.reject(e)
        }
        const downloadStream = this.bucket.openDownloadStream(id)
        var fileData: Uint8Array[] = []
        downloadStream.on('data', (chunk) => {
          fileData.push(chunk)
        })
        downloadStream.on('error', () => {
          return deferred.reject(new Error('Error getting steam account file'))
        })
        downloadStream.on('end', () => {
          return deferred.resolve(Buffer.concat(fileData))
        })
      }
    }).catch((e) => {
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<Buffer | null>
  }
}

export function getMongooseConfig (prefix: string = 'mdb_', ssl: boolean = false): string {
  var userString = ''
  if (process.env[`${prefix}username`] !== undefined &&
    process.env[`${prefix}password`] !== undefined &&
    process.env[`${prefix}username`] !== '' &&
    process.env[`${prefix}password`] !== '') {
    userString = `${process.env[`${prefix}username`] ?? ''}:${process.env[`${prefix}password`] ?? ''}@`
  }
  var conPrefix = process.env[`${prefix}prefix`] ?? 'mongodb+srv://'
  const conString = `${conPrefix}${userString}${process.env[`${prefix}cluster_url`] ?? 'localhost'}/${process.env[`${prefix}database`] ?? 'test'}?retryWrites=true&w=majority&ssl=${ssl ? 'true' : 'false'}`
  logger.info(conString)
  return conString
}
