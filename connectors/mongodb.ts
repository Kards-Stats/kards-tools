import { getCurrentLogger } from '../includes/logger'
import mongoose from 'mongoose'
import { SteamAccountConnector } from './types'
import { SteamUser } from '../types/backend'
import stream from 'stream'
import { ObjectId, GridFSBucket } from 'mongodb'

const logger = getCurrentLogger('models-steam-user')

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
  bucket: GridFSBucket

  constructor (collectionName: string, connection: mongoose.Connection) {
    if (connection === null || connection.readyState !== 1) {
      throw new Error('Connection doesnt exist or isnt ready')
    }
    this.SteamUserModel = connection.model(collectionName, SteamUserSchema) as any as mongoose.Model<SteamUserDocument>
    this.SteamUserFilesModel = connection.model(`${collectionName}_files`, SteamUserFileSchema) as any as mongoose.Model<SteamUserFilesDocument>
    this.bucket = new GridFSBucket(connection.db, {
      bucketName: `${collectionName}_files`
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
    const query = type !== '*' ? { type: type, banned: false } : { banned: false }
    var results = await this.SteamUserModel.find(query)
    return this.formatSteamUsers(results)
  }

  async getUser (user: string): Promise<SteamUser | null> {
    logger.silly(`getUser(${user})`)
    const query = { username: user }
    var result = await this.SteamUserModel.findOne(query)
    return this.formatSteamUser(result)
  }

  async getOldest (type = '*'): Promise<SteamUser | null> {
    logger.silly(`getOldest(${type})`)
    const query = type !== '*' ? { type: type, banned: false } : { banned: false }
    var result = await this.SteamUserModel.findOne(query, null, { sort: { last_steam_login: 1 } })
    return this.formatSteamUser(result)
  }

  async addSteamLogin (user: string, steamId: string, ticket: string): Promise<SteamUser | null> {
    logger.silly(`addSteamLogin(${user}, ${steamId}, ${ticket})`)
    const query = { username: user }
    var result = await this.SteamUserModel.findOne(query)
    if (result === null) {
      return null
    }
    result.last_steam_login = new Date()
    result.steam_id = steamId
    result.ticket = ticket
    await result.save()
    return this.formatSteamUser(result)
  }

  async setBanned (user: string, banned: boolean): Promise<SteamUser | null> {
    logger.silly(`setBanned(${user}, ${banned ? 'true' : 'false'})`)
    const query = { username: user }
    var result = await this.SteamUserModel.findOne(query)
    if (result === null) {
      return null
    }
    result.banned = banned
    result.steam_id = undefined
    result.ticket = undefined
    await result.save()
    return this.formatSteamUser(result)
  }

  async addKardsLogin (user: string): Promise<SteamUser | null> {
    logger.silly(`addKardsLogin(${user})`)
    const query = { username: user }
    var result = await this.SteamUserModel.findOne(query)
    if (result === null) {
      return null
    }
    result.last_kards_login = new Date()
    await result.save()
    return this.formatSteamUser(result)
  }

  async saveFile (filename: string, contents: Buffer): Promise<void> {
    return await new Promise<void>((resolve, reject) => {
      const readableStream = new stream.Readable()
      readableStream.push(contents)
      readableStream.push(null)
      const uploadStream = this.bucket.openUploadStream(filename)
      const id = uploadStream.id.toLocaleString()
      // Have to ignore typing here as a solution couldnt be found
      readableStream.pipe(uploadStream as any)
      uploadStream.once('error', () => {
        /* istanbul ignore next */
        uploadStream.removeAllListeners('error')
        uploadStream.removeAllListeners('finish')
        return reject(new Error('Error updating steam account file'))
      })
      uploadStream.once('finish', () => {
        uploadStream.removeAllListeners('error')
        uploadStream.removeAllListeners('finish')
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
            return resolve()
          }).catch((e) => {
            /* istanbul ignore next */
            return reject(e)
          })
        }).catch((e) => {
          /* istanbul ignore next */
          return reject(e)
        })
      })
    })
  }

  async readFile (filename: string): Promise<Buffer | null> {
    return await new Promise<Buffer | null>((resolve, reject) => {
      this.SteamUserFilesModel.findOne({ filename: filename }).then((file) => {
        if (file === null) {
          return resolve(null)
        } else {
          try {
            var id = new ObjectId(file.id)
          } catch (e) {
            /* istanbul ignore next */
            return reject(e)
          }
          const downloadStream = this.bucket.openDownloadStream(id)
          var fileData: Uint8Array[] = []
          downloadStream.on('data', (chunk) => {
            fileData.push(chunk)
          })
          downloadStream.on('error', () => {
            /* istanbul ignore next */
            return reject(new Error('Error getting steam account file'))
          })
          downloadStream.on('end', () => {
            return resolve(Buffer.concat(fileData))
          })
        }
      }).catch((e) => {
        /* istanbul ignore next */
        return reject(e)
      })
    })
  }
}

/* istanbul ignore next */
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
