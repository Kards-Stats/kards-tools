const { MongoDBSteamUserConnector } = require('../../connectors')
import * as db from '../helpers/db'
import { SteamUser } from '../../types/backend'

const date = new Date(0)
const now = new Date()

const steamNew1: SteamUser = {
  username: 'steam1',
  password: 'steam1',
  type: 'steam1',
  banned: false,
  last_steam_login: date,
  last_kards_login: date
}
/*
const steamNew2a: SteamUser = {
  username: 'steam2a',
  password: 'steam2a',
  type: 'steam2',
  banned: false,
  last_steam_login: date,
  last_kards_login: date
}

const steamNew2b: SteamUser = {
  username: 'steam2b',
  password: 'steam2b',
  type: 'steam2',
  banned: false,
  last_steam_login: date,
  last_kards_login: date
}
*/
const steamNow1: SteamUser = {
  username: 'steam1',
  password: 'steam1',
  type: 'steam1',
  banned: false,
  steam_id: 'steam1id',
  ticket: 'steam1ticket',
  last_steam_login: now,
  last_kards_login: now
}
/*
const steamNow2a: SteamUser = {
  username: 'steam2a',
  password: 'steam2a',
  type: 'steam2',
  banned: false,
  steam_id: 'steam2aid',
  ticket: 'steam2aticket',
  last_steam_login: now,
  last_kards_login: now
}

const steamNow2b: SteamUser = {
  username: 'steam2b',
  password: 'steam2b',
  type: 'steam2',
  banned: false,
  steam_id: 'steam2bid',
  ticket: 'steam2bticket',
  last_steam_login: now,
  last_kards_login: now
}
*/
const steamEmpty: SteamUser = {
  username: '',
  password: '',
  type: '',
  banned: false,
  last_steam_login: now,
  last_kards_login: now
}

const steamFull: SteamUser = {
  username: 'steamFull',
  password: 'steamFull',
  type: 'steamFull',
  banned: true,
  steam_id: 'steamFullId',
  ticket: 'steamFullTicket',
  last_steam_login: now,
  last_kards_login: now
}
describe('addSteamUser', () => {
  var connector: typeof MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should Throw for null or empty', async () => {
    expect(connector.addSteamUser('', '', '')).rejects.toBeDefined()
    expect(connector.addSteamUser('username', '', '')).rejects.toBeDefined()
    expect(connector.addSteamUser('', 'password', '')).rejects.toBeDefined()
    expect(connector.addSteamUser('', '', 'type')).rejects.toBeDefined()
    expect(connector.addSteamUser('username', 'password', '')).rejects.toBeDefined()
    expect(connector.addSteamUser('', 'password', 'type')).rejects.toBeDefined()
    expect(connector.addSteamUser('username', '', 'type')).rejects.toBeDefined()
  })
  it('Should ignore on user already there', async () => {
    await (new connector.SteamUserModel(steamNow1)).save()
    await connector.addSteamUser(steamNow1.username, steamNow1.password, steamNow1.type)
    const user = await connector.SteamUserModel.findOne({ username: steamNow1.username })
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow1.username)
      expect(user.password).toBe(steamNow1.password)
      expect(user.type).toBe(steamNow1.type)
      expect(user.ticket).toBeDefined()
      expect(user.ticket).toBe(steamNow1.ticket)
      expect(user.steam_id).toBeDefined()
      expect(user.steam_id).toBe(steamNow1.steam_id)
      expect(user.last_steam_login.toISOString()).toBe(steamNow1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNow1.last_kards_login.toISOString())
    }
  })
  it('Should add new user', async () => {
    var user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).toBeNull()
    await connector.addSteamUser(steamNew1.username, steamNew1.password, steamNew1.type)
    user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.ticket).not.toBeDefined()
      expect(user.steam_id).not.toBeDefined()
      expect(user.last_steam_login.toISOString()).toBe(date.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(date.toISOString())
    }
  })
})

describe('formatSteamUser', () => {
  var connector: typeof MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null', async () => {
    const user: SteamUser | null = connector.formatSteamUser(null)
    expect(user).toBeNull()
  })
  it('Should return empty document', async () => {
    const document = new connector.SteamUserModel(steamEmpty)
    const user: SteamUser | null = connector.formatSteamUser(document)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamEmpty.username)
      expect(user.password).toBe(steamEmpty.password)
      expect(user.type).toBe(steamEmpty.type)
      expect(user.steam_id).toBeUndefined()
      expect(user.ticket).toBeUndefined()
      expect(user.banned).toBe(steamEmpty.banned)
      expect(user.last_steam_login).toBe(steamEmpty.last_steam_login)
      expect(user.last_kards_login).toBe(steamEmpty.last_kards_login)
    }
  })
  it('Should return full document', async () => {
    const document = new connector.SteamUserModel(steamFull)
    const user: SteamUser | null = connector.formatSteamUser(document)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamFull.username)
      expect(user.password).toBe(steamFull.password)
      expect(user.type).toBe(steamFull.type)
      expect(user.steam_id).toBe(steamFull.steam_id)
      expect(user.ticket).toBe(steamFull.ticket)
      expect(user.banned).toBe(steamFull.banned)
      expect(user.last_steam_login).toBe(steamFull.last_steam_login)
      expect(user.last_kards_login).toBe(steamFull.last_kards_login)
    }
  })
})

describe('formatSteamUsers', () => {
  var connector: typeof MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return empty array', async () => {
    const user: SteamUser | null = connector.formatSteamUser(null)
    expect(user).toBeNull()
  })
  it('Should return empty document', async () => {
    const users: Array<SteamUser | null> = connector.formatSteamUsers([])
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    expect(users.length).toBe(0)
  })
  it('Should return empty document', async () => {
    const document = new connector.SteamUserModel(steamEmpty)
    const users: Array<SteamUser | null> = connector.formatSteamUsers([document])
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    expect(users.length).toBe(1)
    expect(users[0]).toBeDefined()
    expect(users[0]).not.toBeNull()
    if (users[0] !== null) {
      expect(users[0].username).toBe(steamEmpty.username)
      expect(users[0].password).toBe(steamEmpty.password)
      expect(users[0].type).toBe(steamEmpty.type)
      expect(users[0].steam_id).toBe(steamEmpty.steam_id)
      expect(users[0].ticket).toBe(steamEmpty.ticket)
      expect(users[0].banned).toBe(steamEmpty.banned)
      expect(users[0].last_steam_login).toBe(steamEmpty.last_steam_login)
      expect(users[0].last_kards_login).toBe(steamEmpty.last_kards_login)
    }
  })
  it('Should return full document', async () => {
    const document = new connector.SteamUserModel(steamFull)
    const users: Array<SteamUser | null> = connector.formatSteamUsers([document])
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    expect(users.length).toBe(1)
    expect(users[0]).toBeDefined()
    expect(users[0]).not.toBeNull()
    if (users[0] !== null) {
      expect(users[0].username).toBe(steamFull.username)
      expect(users[0].password).toBe(steamFull.password)
      expect(users[0].type).toBe(steamFull.type)
      expect(users[0].steam_id).toBe(steamFull.steam_id)
      expect(users[0].ticket).toBe(steamFull.ticket)
      expect(users[0].banned).toBe(steamFull.banned)
      expect(users[0].last_steam_login).toBe(steamFull.last_steam_login)
      expect(users[0].last_kards_login).toBe(steamFull.last_kards_login)
    }
  })
  it('Should return full document', async () => {
    const fullDocument = new connector.SteamUserModel(steamFull)
    const emptyDocument = new connector.SteamUserModel(steamEmpty)
    const users: Array<SteamUser | null> = connector.formatSteamUsers([fullDocument, emptyDocument])
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    expect(users.length).toBe(2)
    expect(users[0]).toBeDefined()
    expect(users[0]).not.toBeNull()
    if (users[0] !== null) {
      expect(users[0].username).toBe(steamFull.username)
      expect(users[0].password).toBe(steamFull.password)
      expect(users[0].type).toBe(steamFull.type)
      expect(users[0].steam_id).toBe(steamFull.steam_id)
      expect(users[0].ticket).toBe(steamFull.ticket)
      expect(users[0].banned).toBe(steamFull.banned)
      expect(users[0].last_steam_login).toBe(steamFull.last_steam_login)
      expect(users[0].last_kards_login).toBe(steamFull.last_kards_login)
    }
    expect(users[1]).toBeDefined()
    expect(users[1]).not.toBeNull()
    if (users[1] !== null) {
      expect(users[1].username).toBe(steamEmpty.username)
      expect(users[1].password).toBe(steamEmpty.password)
      expect(users[1].type).toBe(steamEmpty.type)
      expect(users[1].steam_id).toBe(steamEmpty.steam_id)
      expect(users[1].ticket).toBe(steamEmpty.ticket)
      expect(users[1].banned).toBe(steamEmpty.banned)
      expect(users[1].last_steam_login).toBe(steamEmpty.last_steam_login)
      expect(users[1].last_kards_login).toBe(steamEmpty.last_kards_login)
    }
  })
})
