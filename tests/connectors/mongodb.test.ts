import { MongoDBSteamUserConnector, SteamAccountConnector } from '../../connectors'
import * as db from '../helpers/db'
import { SteamUser } from '../../types/backend'

const date = new Date(0)
const now = new Date()

const oneDay = 24 * 60 * 60 * 1000

const steamNew1: SteamUser = {
  username: 'steam1',
  password: 'steam1',
  type: 'steam1',
  banned: false,
  last_steam_login: date,
  last_kards_login: date
}

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

const steamNow2c: SteamUser = {
  username: 'steam2c',
  password: 'steam2c',
  type: 'steam2',
  banned: true,
  steam_id: 'steam2cid',
  ticket: 'steam2cticket',
  last_steam_login: now,
  last_kards_login: now
}

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
describe('Constructor', () => {
  it('Should Throw for no connection', async () => {
    expect(() => {
      new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    }).toThrow()
  })
})

describe('addSteamUser', () => {
  var connector: MongoDBSteamUserConnector
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
    expect(connector.addSteamUser('', '', '')).rejects.toBeTruthy()
    expect(connector.addSteamUser('username', '', '')).rejects.toBeTruthy()
    expect(connector.addSteamUser('', 'password', '')).rejects.toBeTruthy()
    expect(connector.addSteamUser('', '', 'type')).rejects.toBeTruthy()
    expect(connector.addSteamUser('username', 'password', '')).rejects.toBeTruthy()
    expect(connector.addSteamUser('', 'password', 'type')).rejects.toBeTruthy()
    expect(connector.addSteamUser('username', '', 'type')).rejects.toBeTruthy()
  })
  it('Should ignore on user already there default', async () => {
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
  it('Should ignore on user already there', async () => {
    await (new connector.SteamUserModel(steamNow1)).save()
    await connector.addSteamUser(steamNow1.username, steamNow1.password, steamNow1.type, false)
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
  it('Should overwrite on user already there when set', async () => {
    await (new connector.SteamUserModel(steamNow1)).save()
    await connector.addSteamUser(steamNow1.username, steamNow1.password, steamNow1.type, true)
    const user = await connector.SteamUserModel.findOne({ username: steamNow1.username })
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow1.username)
      expect(user.password).toBe(steamNow1.password)
      expect(user.type).toBe(steamNow1.type)
      expect(user.ticket).toBeUndefined()
      expect(user.steam_id).toBeUndefined()
      expect(user.last_steam_login.toISOString()).toBe(date.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(date.toISOString())
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
  var connector: MongoDBSteamUserConnector
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
      expect(user.last_steam_login.toISOString()).toBe(steamEmpty.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamEmpty.last_kards_login.toISOString())
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
      expect(user.last_steam_login.toISOString()).toBe(steamFull.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamFull.last_kards_login.toISOString())
    }
  })
})

describe('formatSteamUsers', () => {
  var connector: MongoDBSteamUserConnector
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
      expect(users[0].last_steam_login.toISOString()).toBe(steamEmpty.last_steam_login.toISOString())
      expect(users[0].last_kards_login.toISOString()).toBe(steamEmpty.last_kards_login.toISOString())
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
      expect(users[0].last_steam_login.toISOString()).toBe(steamFull.last_steam_login.toISOString())
      expect(users[0].last_kards_login.toISOString()).toBe(steamFull.last_kards_login.toISOString())
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
      expect(users[0].last_steam_login.toISOString()).toBe(steamFull.last_steam_login.toISOString())
      expect(users[0].last_kards_login.toISOString()).toBe(steamFull.last_kards_login.toISOString())
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
      expect(users[1].last_steam_login.toISOString()).toBe(steamEmpty.last_steam_login.toISOString())
      expect(users[1].last_kards_login.toISOString()).toBe(steamEmpty.last_kards_login.toISOString())
    }
  })
})

describe('getUnbanned', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNew2a, steamNew2b, steamNow2c)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty string', async () => {
    var users: Array<SteamUser | null> = await connector.getUnbanned('')
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
  })
  it('Should return null for no type', async () => {
    var users: Array<SteamUser | null> = await connector.getUnbanned('notype')
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
  })
  it('Should return one for specific type', async () => {
    var users: Array<SteamUser | null> = await connector.getUnbanned('steam1')
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    if (users !== null) {
      expect(users.length).toBe(1)
      expect(users[0]).toBeDefined()
      expect(users[0]).not.toBeNull()
      if (users[0] !== null) {
        expect(users[0].username).toBe(steamNew1.username)
        expect(users[0].password).toBe(steamNew1.password)
        expect(users[0].type).toBe(steamNew1.type)
        expect(users[0].steam_id).toBe(steamEmpty.steam_id)
        expect(users[0].ticket).toBe(steamEmpty.ticket)
        expect(users[0].banned).toBe(steamNew1.banned)
        expect(users[0].last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
        expect(users[0].last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
      }
    }
  })
  it('Should return two for specific type', async () => {
    var users: Array<SteamUser | null> = await connector.getUnbanned('steam2')
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    if (users !== null) {
      expect(users.length).toBe(2)
      expect(users[0]).toBeDefined()
      expect(users[0]).not.toBeNull()
      if (users[0] !== null) {
        expect(users[0].username).toBe(steamNew2a.username)
        expect(users[0].password).toBe(steamNew2a.password)
        expect(users[0].type).toBe(steamNew2a.type)
        expect(users[0].steam_id).toBe(steamNew2a.steam_id)
        expect(users[0].ticket).toBe(steamNew2a.ticket)
        expect(users[0].banned).toBe(steamNew2a.banned)
        expect(users[0].last_steam_login.toISOString()).toBe(steamNew2a.last_steam_login.toISOString())
        expect(users[0].last_kards_login.toISOString()).toBe(steamNew2a.last_kards_login.toISOString())
      }
      expect(users[1]).toBeDefined()
      expect(users[1]).not.toBeNull()
      if (users[1] !== null) {
        expect(users[1].username).toBe(steamNew2b.username)
        expect(users[1].password).toBe(steamNew2b.password)
        expect(users[1].type).toBe(steamNew2b.type)
        expect(users[1].steam_id).toBe(steamNew2b.steam_id)
        expect(users[1].ticket).toBe(steamNew2b.ticket)
        expect(users[1].banned).toBe(steamNew2b.banned)
        expect(users[1].last_steam_login.toISOString()).toBe(steamNew2b.last_steam_login.toISOString())
        expect(users[1].last_kards_login.toISOString()).toBe(steamNew2b.last_kards_login.toISOString())
      }
    }
  })
  it('Should return all for *', async () => {
    var users: Array<SteamUser | null> = await connector.getUnbanned('*')
    expect(users).toBeDefined()
    expect(users).not.toBeNull()
    if (users !== null) {
      expect(users.length).toBe(3)
      expect(users[0]).toBeDefined()
      expect(users[0]).not.toBeNull()
      if (users[0] !== null) {
        expect(users[0].username).toBe(steamNew1.username)
        expect(users[0].password).toBe(steamNew1.password)
        expect(users[0].type).toBe(steamNew1.type)
        expect(users[0].steam_id).toBe(steamEmpty.steam_id)
        expect(users[0].ticket).toBe(steamEmpty.ticket)
        expect(users[0].banned).toBe(steamNew1.banned)
        expect(users[0].last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
        expect(users[0].last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
      }
      expect(users[1]).toBeDefined()
      expect(users[1]).not.toBeNull()
      if (users[1] !== null) {
        expect(users[1].username).toBe(steamNew2a.username)
        expect(users[1].password).toBe(steamNew2a.password)
        expect(users[1].type).toBe(steamNew2a.type)
        expect(users[1].steam_id).toBe(steamNew2a.steam_id)
        expect(users[1].ticket).toBe(steamNew2a.ticket)
        expect(users[1].banned).toBe(steamNew2a.banned)
        expect(users[1].last_steam_login.toISOString()).toBe(steamNew2a.last_steam_login.toISOString())
        expect(users[1].last_kards_login.toISOString()).toBe(steamNew2a.last_kards_login.toISOString())
      }
      expect(users[2]).toBeDefined()
      expect(users[2]).not.toBeNull()
      if (users[2] !== null) {
        expect(users[2].username).toBe(steamNew2b.username)
        expect(users[2].password).toBe(steamNew2b.password)
        expect(users[2].type).toBe(steamNew2b.type)
        expect(users[2].steam_id).toBe(steamNew2b.steam_id)
        expect(users[2].ticket).toBe(steamNew2b.ticket)
        expect(users[2].banned).toBe(steamNew2b.banned)
        expect(users[2].last_steam_login.toISOString()).toBe(steamNew2b.last_steam_login.toISOString())
        expect(users[2].last_kards_login.toISOString()).toBe(steamNew2b.last_kards_login.toISOString())
      }
    }
  })
})

describe('getUser', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNew2a, steamNew2b)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty string', async () => {
    var user: SteamUser | null = await connector.getUser('')
    expect(user).toBeNull()
  })
  it('Should return null for no type', async () => {
    var user: SteamUser | null = await connector.getUser('notype')
    expect(user).toBeNull()
  })
  it('Should return one for specific user', async () => {
    var user: SteamUser | null = await connector.getUser('steam1')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe(steamEmpty.steam_id)
      expect(user.ticket).toBe(steamEmpty.ticket)
      expect(user.banned).toBe(steamNew1.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
})

describe('getOldest', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNow2a, steamNew2b)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty string', async () => {
    var user: SteamUser | null = await connector.getOldest('')
    expect(user).toBeNull()
  })
  it('Should return null for no type', async () => {
    var user: SteamUser | null = await connector.getOldest('notype')
    expect(user).toBeNull()
  })
  it('Should return one for all types', async () => {
    var user: SteamUser | null = await connector.getOldest('*')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe(steamEmpty.steam_id)
      expect(user.ticket).toBe(steamEmpty.ticket)
      expect(user.banned).toBe(steamNew1.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
  it('Should return one for type 1', async () => {
    var user: SteamUser | null = await connector.getOldest('steam1')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe(steamEmpty.steam_id)
      expect(user.ticket).toBe(steamEmpty.ticket)
      expect(user.banned).toBe(steamNew1.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
  it('Should return one for type 1', async () => {
    var user: SteamUser | null = await connector.getOldest('steam2')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew2b.username)
      expect(user.password).toBe(steamNew2b.password)
      expect(user.type).toBe(steamNew2b.type)
      expect(user.steam_id).toBe(steamNew2b.steam_id)
      expect(user.ticket).toBe(steamNew2b.ticket)
      expect(user.banned).toBe(steamNew2b.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew2b.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew2b.last_kards_login.toISOString())
    }
  })
})

describe('addSteamLogin', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNow2a, steamNew2b)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty user', async () => {
    var user: SteamUser | null = await connector.addSteamLogin('', '', '')
    expect(user).toBeNull()
  })
  it('Should return null for no user', async () => {
    var user: SteamUser | null = await connector.addSteamLogin('nouser', '', '')
    expect(user).toBeNull()
  })
  it('Should return one for user empty values', async () => {
    var user: SteamUser | null = await connector.addSteamLogin(steamNew1.username, '', '')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe('')
      expect(user.ticket).toBe('')
      expect(user.banned).toBe(steamNew1.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
    user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe('')
      expect(user.ticket).toBe('')
      expect(user.banned).toBe(steamNew1.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
  it('Should return one for user with values', async () => {
    var user: SteamUser | null = await connector.addSteamLogin(steamNew1.username, 'newid', 'newticket')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe('newid')
      expect(user.ticket).toBe('newticket')
      expect(user.banned).toBe(steamNew1.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
    user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe('newid')
      expect(user.ticket).toBe('newticket')
      expect(user.banned).toBe(steamNew1.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
  it('Should return new oldest for user with changing values', async () => {
    var user: SteamUser | null = await connector.addSteamLogin(steamNew2b.username, 'newid', 'newticket')
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew2b.username)
      expect(user.password).toBe(steamNew2b.password)
      expect(user.type).toBe(steamNew2b.type)
      expect(user.steam_id).toBe('newid')
      expect(user.ticket).toBe('newticket')
      expect(user.banned).toBe(steamNew2b.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNew2b.last_kards_login.toISOString())
    }
    user = await connector.getOldest(steamNow2a.type)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow2a.username)
      expect(user.password).toBe(steamNow2a.password)
      expect(user.type).toBe(steamNow2a.type)
      expect(user.steam_id).toBe(steamNow2a.steam_id)
      expect(user.ticket).toBe(steamNow2a.ticket)
      expect(user.banned).toBe(steamNow2a.banned)
      expect(now.getTime() - user.last_steam_login.getTime()).toBeLessThan(oneDay)
      expect(user.last_kards_login.toISOString()).toBe(steamNow2a.last_kards_login.toISOString())
    }
  })
})

describe('setBanned', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNow2a, steamNew2b, steamNow2c)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty user', async () => {
    var user: SteamUser | null = await connector.setBanned('', false)
    expect(user).toBeNull()
  })
  it('Should return null for no user', async () => {
    var user: SteamUser | null = await connector.setBanned('nouser', false)
    expect(user).toBeNull()
  })
  it('Should return one for user true', async () => {
    var user: SteamUser | null = await connector.setBanned(steamNew1.username, true)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBeUndefined()
      expect(user.ticket).toBeUndefined()
      expect(user.banned).toBe(true)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
    user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBeUndefined()
      expect(user.ticket).toBeUndefined()
      expect(user.banned).toBe(true)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNew1.last_kards_login.toISOString())
    }
  })
  it('Should return one for user empty values', async () => {
    var user: SteamUser | null = await connector.setBanned(steamNow2c.username, false)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow2c.username)
      expect(user.password).toBe(steamNow2c.password)
      expect(user.type).toBe(steamNow2c.type)
      expect(user.steam_id).toBeUndefined()
      expect(user.ticket).toBeUndefined()
      expect(user.banned).toBe(false)
      expect(user.last_steam_login.toISOString()).toBe(steamNow2c.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNow2c.last_kards_login.toISOString())
    }
    user = await connector.SteamUserModel.findOne({ username: steamNow2c.username })
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow2c.username)
      expect(user.password).toBe(steamNow2c.password)
      expect(user.type).toBe(steamNow2c.type)
      expect(user.steam_id).toBeUndefined()
      expect(user.ticket).toBeUndefined()
      expect(user.banned).toBe(false)
      expect(user.last_steam_login.toISOString()).toBe(steamNow2c.last_steam_login.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(steamNow2c.last_kards_login.toISOString())
    }
  })
})

describe('addKardsLogin', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  beforeEach(async () => {
    await connector.SteamUserModel.create(steamNew1, steamNow2a, steamNew2b)
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return null for empty user', async () => {
    var user: SteamUser | null = await connector.addKardsLogin('')
    expect(user).toBeNull()
  })
  it('Should return null for no user', async () => {
    var user: SteamUser | null = await connector.addKardsLogin('nouser')
    expect(user).toBeNull()
  })
  it('Should return one for user', async () => {
    var user: SteamUser | null = await connector.addKardsLogin(steamNew1.username)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe(steamNew1.steam_id)
      expect(user.ticket).toBe(steamNew1.ticket)
      expect(user.banned).toBe(steamNew1.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(now.getTime() - user.last_kards_login.getTime()).toBeLessThan(oneDay)
    }
    user = await connector.SteamUserModel.findOne({ username: steamNew1.username })
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNew1.username)
      expect(user.password).toBe(steamNew1.password)
      expect(user.type).toBe(steamNew1.type)
      expect(user.steam_id).toBe(steamNew1.steam_id)
      expect(user.ticket).toBe(steamNew1.ticket)
      expect(user.banned).toBe(steamNew1.banned)
      expect(user.last_steam_login.toISOString()).toBe(steamNew1.last_steam_login.toISOString())
      expect(now.getTime() - user.last_kards_login.getTime()).toBeLessThan(oneDay)
    }
  })
})

describe('Type match', () => {
  var connector: SteamAccountConnector
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
  it('Should have addSteamUser', async () => {
    var user: SteamUser | null = await connector.addSteamUser(steamNow1.username, steamNow1.password, steamNow1.type)
    expect(user).toBeDefined()
    expect(user).not.toBeNull()
    if (user !== null) {
      expect(user.username).toBe(steamNow1.username)
      expect(user.password).toBe(steamNow1.password)
      expect(user.type).toBe(steamNow1.type)
      expect(user.ticket).toBeUndefined()
      expect(user.steam_id).toBeUndefined()
      expect(user.last_steam_login.toISOString()).toBe(date.toISOString())
      expect(user.last_kards_login.toISOString()).toBe(date.toISOString())
    }
  })
  it('Should have getUnbanned', async () => {
    var user: Array<SteamUser | null> = await connector.getUnbanned(steamNow1.type)
    expect(user).toBeDefined()
    expect(user.length).toBe(0)
  })
  it('Should have getUser', async () => {
    var user: SteamUser | null = await connector.getUser(steamNow1.username)
    expect(user).toBeNull()
  })
  it('Should have getOldest', async () => {
    var user: SteamUser | null = await connector.getOldest(steamNow1.type)
    expect(user).toBeNull()
  })
  it('Should have addSteamLogin', async () => {
    var user: SteamUser | null = await connector.addSteamLogin(steamNow1.username, '', '')
    expect(user).toBeNull()
  })
  it('Should have addKardsLogin', async () => {
    var user: SteamUser | null = await connector.addKardsLogin(steamNow1.username)
    expect(user).toBeNull()
  })
  it('Should have setBanned', async () => {
    var user: SteamUser | null = await connector.setBanned(steamNow1.username, false)
    expect(user).toBeNull()
  })
})