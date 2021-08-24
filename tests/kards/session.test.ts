import { MongoDBSteamUserConnector } from '../../connectors'
import * as db from '../helpers/db'
import { SteamUser } from '../../types/backend'
import users from './users.json'
import { Session } from '../../kards'
import { Session as SessionType } from '../../types/kards-backend'
import { wait } from '../helpers/utils'

const date = new Date(0)
const now = new Date()

interface User {
  username: string
  password: string
}

interface Users {
  accounts: User[]
  steamGuardAccount: User
  bannedAccount: User
}

const usersTyped: Users = users as Users
const accountType: string = 'test-type'
const invalidType: string = 'invalid-type'
const emptySession: SessionType = {
  achievements_url: '',
  britain_level: 0,
  britain_xp: 0,
  client_id: 0,
  client_url: '',
  dailymissions_url: '',
  decks_url: '',
  draft_admissions: 0,
  dust: 0,
  email: '',
  email_reward_received: false,
  email_verified: false,
  germany_level: 0,
  germany_xp: 0,
  gold: 0,
  has_been_officer: false,
  heartbeat_url: '',
  is_officer: false,
  is_online: false,
  japan_level: 0,
  japan_xp: 0,
  jti: 'ttgsf',
  jwt: '',
  last_daily_mission_cancel: null,
  last_daily_mission_renewal: '',
  last_logon_date: '',
  launch_messages: [],
  library_url: '',
  new_cards: [],
  new_player_login_reward: {
    day: 0,
    reset: '',
    seconds: 0
  },
  npc: false,
  online_flag: false,
  packs_url: '',
  player_id: 4353645,
  player_name: '',
  player_tag: 0,
  player_url: '',
  rewards: [],
  season_end: '',
  season_wins: 0,
  server_time: '',
  soviet_level: 0,
  soviet_xp: 0,
  stars: 0,
  tutorials_done: 0,
  tutorials_finished: [],
  usa_level: 0,
  usa_xp: 0,
  user_id: 0,
  user_url: ''
}

describe('Users JSON', () => {
  it('Should exist', async () => {
    expect(usersTyped).toBeTruthy()
  })
  it('Should have accounts', async () => {
    expect(usersTyped.accounts).toBeTruthy()
    expect(Array.isArray(usersTyped.accounts)).toBe(true)
  })
  it('Should have at least 3 accounts', async () => {
    expect(usersTyped.accounts.length).toBeGreaterThanOrEqual(3)
  })
  it('Should have strings for all accounts', async () => {
    for (var account of usersTyped.accounts) {
      expect(account).toBeTruthy()
      expect(typeof account).toBe('object')
      expect(typeof account.username).toBe('string')
      expect(account.username.trim()).toBeTruthy()
      expect(typeof account.password).toBe('string')
      expect(account.password.trim()).toBeTruthy()
    }
  })
})

describe('Constructor', () => {
  var connector: MongoDBSteamUserConnector
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
  })
  afterEach(async () => {
    await db.clearDatabase()
  })
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should create default', async () => {
    var session = new Session(accountType, connector)
    expect(session).toBeTruthy()
    expect(session.kardsAppId).toBeTruthy()
    expect(session.type).toBeTruthy()
    expect(session.type).toBe(accountType)
    expect(session.driftApiKey).toBeTruthy()
  })
  it('Should throw for blank drift api key', async () => {
    expect(() => {
      var session = new Session(accountType, connector, undefined, '')
      expect(session).toThrow()
    }).toThrow()
  })
  it('Should throw for blank app id', async () => {
    expect(() => {
      var session = new Session(accountType, connector, undefined, '1939-kards-5dcba429f', '')
      expect(session).toThrow()
    }).toThrow()
  })
  it('Should throw for blank both', async () => {
    expect(() => {
      var session = new Session(accountType, connector, undefined, '', '')
      expect(session).toThrow()
    }).toThrow()
  })
  it('Should create default app id', async () => {
    var session = new Session(accountType, connector, undefined, '1939-kards-5dcba429f')
    expect(session).toBeTruthy()
    expect(session.kardsAppId).toBeTruthy()
    expect(session.type).toBeTruthy()
    expect(session.type).toBe(accountType)
    expect(session.driftApiKey).toBe('1939-kards-5dcba429f')
  })
  it('Should create custom app id and drift api key', async () => {
    var session = new Session(accountType, connector, undefined, '1939-kards-5dcba429f', '1')
    expect(session).toBeTruthy()
    expect(session.kardsAppId).toBe('1')
    expect(session.type).toBeTruthy()
    expect(session.type).toBe(accountType)
    expect(session.driftApiKey).toBe('1939-kards-5dcba429f')
  })
})

describe('login', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should login fine', async () => {
    var user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    var internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should overwrite for new user', async () => {
    var user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    var internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(session.steamUser).toBeDefined()
    expect(session.steamUser?.ticket).toBeUndefined()
    if (session.steamUser !== undefined) {
      session.steamUser.ticket = 'ticket'
    }
    expect(session.steamUser?.ticket).toBe('ticket')
    expect(session.steamUser?.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
    user = await connector.getUser(usersTyped.accounts[1].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(session.steamUser).toBeDefined()
    expect(session.steamUser?.ticket).toBeUndefined()
    expect(session.steamUser?.username).toBe(usersTyped.accounts[1].username)
    await wait(1)
  }, 20000)
  it('Should return info for same account', async () => {
    var user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    var internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(session.steamUser).toBeDefined()
    expect(session.steamUser?.ticket).toBeUndefined()
    if (session.steamUser !== undefined) {
      session.steamUser.ticket = 'ticket'
    }
    expect(session.steamUser?.ticket).toBe('ticket')
    expect(session.steamUser?.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
    user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(internalUser).toBe(session.steamUser)
    await wait(1)
  }, 20000)
  it('Should return default info for same account', async () => {
    var user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    var internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(session.steamUser).toBeDefined()
    expect(session.steamUser?.ticket).toBeUndefined()
    expect(session.steamUser?.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
    session.steamUser = undefined
    user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(internalUser.ticket).toBeUndefined()
    expect(internalUser.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
  }, 20000)
  it('Should return relog info for same account', async () => {
    var user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    var internalUser = await session.login(user, false)
    expect(internalUser).toBeTruthy()
    expect(session.steamUser).toBeDefined()
    expect(session.steamUser?.ticket).toBeUndefined()
    expect(session.steamUser?.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
    user = await connector.getUser(usersTyped.accounts[0].username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    internalUser = await session.login(user, true)
    expect(internalUser).toBeTruthy()
    expect(internalUser).toBe(session.steamUser)
    expect(internalUser.ticket).toBeUndefined()
    expect(internalUser.username).toBe(usersTyped.accounts[0].username)
    await wait(1)
  }, 20000)
  it('Should Throw for steam guard', async () => {
    expect.assertions(1)
    var user = await connector.getUser(usersTyped.steamGuardAccount.username)
    if (user === null) {
      throw new Error('User cannot be null in test')
    }
    await expect(session.login(user, false)).rejects.toBeTruthy()
    await wait(1)
  })
})

describe('refreshSteam', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should reject for invalid or empty', async () => {
    expect.assertions(2)
    await expect(session.refreshSteam('')).rejects.toBeTruthy()
    await wait(1)
    await expect(session.refreshSteam('invalid_user')).rejects.toBeTruthy()
    await wait(1)
  })
  it('Should not re login for 5 seconds', async () => {
    var ticket = await session.refreshSteam(usersTyped.accounts[0].username, false, 5000)
    expect(ticket).toBeTruthy()
    await wait(1)
    ticket = await session.refreshSteam(usersTyped.accounts[0].username, false, 5000)
    expect(ticket).toBe(null)
    await new Promise(resolve => setTimeout(resolve, 5000))
    ticket = await session.refreshSteam(usersTyped.accounts[0].username, false, 5000)
    expect(ticket).toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for steam guard', async () => {
    expect.assertions(1)
    await expect(session.refreshSteam(usersTyped.steamGuardAccount.username)).rejects.toBeTruthy()
    await wait(1)
  })
})

describe('needsNewSession', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return true for undefined', async () => {
    session.session = undefined
    expect(session.needsNewSession()).toBe(true)
  })
  it('Should return true for missing or undefined heartbeat', async () => {
    session.session = emptySession
    expect(session.needsNewSession()).toBe(true)
    session.session = emptySession
    session.session.last_heartbeat = undefined
    expect(session.needsNewSession()).toBe(true)
  })
  it('Should return true for old heartbeat', async () => {
    session.session = emptySession
    session.session.last_heartbeat = date.toISOString()
    expect(session.needsNewSession()).toBe(true)
  })
  it('Should return false for recent heartbeat', async () => {
    session.session = emptySession
    session.session.last_heartbeat = now.toISOString()
    expect(session.needsNewSession()).toBe(false)
  })
})

describe('getSteamTicket', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should reject for undefined steamUserObject', async () => {
    expect.assertions(1)
    session.steamUserObject = undefined
    await expect(session.getSteamTicket()).rejects.toBeTruthy()
    await wait(1)
  })
  it('Should reject for undefined steamUser', async () => {
    expect.assertions(1)
    var tempObj = session.steamUserObject
    session.steamUserObject = {
      accountInfo: 'placeholder'
    }
    session.steamUser = undefined
    await expect(session.getSteamTicket()).rejects.toBeTruthy()
    // Restore for afterAll logout
    session.steamUserObject = tempObj
    await wait(1)
  })
})

describe('getUser', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return SteamUser for default', async () => {
    var user: SteamUser | null = await session.getUser(undefined)
    expect(user).toBeTruthy()
  })
  it('Should return SteamUser for oldest', async () => {
    var user: SteamUser | null = await session.getUser('oldest')
    expect(user).toBeTruthy()
  })
  it('Should return SteamUser for known user', async () => {
    var user: SteamUser | null = await session.getUser(usersTyped.accounts[0].username)
    expect(user).toBeTruthy()
  })
  it('Should return null for invalid user', async () => {
    var user: SteamUser | null = await session.getUser('invalid_user')
    expect(user).toBe(null)
  })
})

describe('getInternalUser', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return InternalUser for existing', async () => {
    session.steamUser = {
      username: 'steamuser',
      steam_id: 'steamid',
      ticket: 'steamticket'
    }
    var user = await session.getInternalUser('')
    expect(user).toBeTruthy()
    expect(session.authenticating).toBe(false)
    if (user !== undefined) {
      expect(user.username).toBe('steamuser')
      expect(user.steam_id).toBe('steamid')
      expect(user.ticket).toBe('steamticket')
    }
    await wait(1)
  })
  it('Should return InternalUser for default', async () => {
    session.steamUser = undefined
    var user = await session.getInternalUser()
    expect(user).toBeTruthy()
    expect(session.authenticating).toBe(false)
    if (user !== undefined) {
      expect(user.username).toBeTruthy()
      expect(user.steam_id).toBeTruthy()
      expect(user.ticket).toBeTruthy()
    }
    await wait(1)
  })
  it('Should return InternalUser for user', async () => {
    session.steamUser = undefined
    var user = await session.getInternalUser(usersTyped.accounts[0].username)
    expect(user).toBeTruthy()
    expect(session.authenticating).toBe(false)
    if (user !== undefined) {
      expect(user.username).toBe(usersTyped.accounts[0].username)
      expect(user.steam_id).toBeTruthy()
      expect(user.ticket).toBeTruthy()
    }
    await wait(1)
  })
  it('Should return InternalUser for user without re auth', async () => {
    session.steamUser = undefined
    var refreshedUser = await session.refreshSteam(usersTyped.accounts[0].username, false, 5000)
    var user = await session.getInternalUser(usersTyped.accounts[0].username)
    expect(refreshedUser).toBeTruthy()
    expect(user).toBeTruthy()
    expect(session.authenticating).toBe(false)
    if (user !== undefined && refreshedUser !== null) {
      expect(user.username).toBe(usersTyped.accounts[0].username)
      expect(user.steam_id).toBeTruthy()
      expect(user.ticket).toBe(refreshedUser.ticket)
    }
    await wait(1)
  })
  it('Should reject on no users available', async () => {
    expect.assertions(1)
    session.steamUser = undefined
    await db.clearDatabase()
    await expect(session.getInternalUser(usersTyped.accounts[0].username)).rejects.toBeTruthy()
    await wait(1)
  })
})

describe('getSession', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should reject for max tries', async () => {
    expect.assertions(1)
    await expect(session.getSession(4)).rejects.toBeTruthy()
  })
  it('Should return session for existing', async () => {
    session.session = emptySession
    session.session.last_heartbeat = now.toISOString()
    var sessionObj = await session.getSession()
    expect(sessionObj).toBeTruthy()
    expect(sessionObj.jti).toBe(emptySession.jti)
    expect(sessionObj.last_heartbeat).toBe(now.toISOString())
    await wait(1)
  })
  it('Should return same session at same time', async () => {
    session.session = undefined
    var promises: Array<Promise<SessionType>> = []
    promises.push(session.getSession())
    await new Promise(resolve => setTimeout(resolve, 0))
    promises.push(session.getSession())
    var [sessionObj1, sessionObj2] = await Promise.all(promises)
    expect(sessionObj1).toBeTruthy()
    expect(sessionObj1.player_id).toBe(sessionObj2.player_id)
    expect(sessionObj1.jti).toBe(sessionObj2.jti)
    expect(sessionObj1.last_heartbeat).toBe(sessionObj2.last_heartbeat)
    await wait(1)
  }, 20000)
  it('Should reject for invalid user', async () => {
    expect.assertions(1)
    await expect(session.getSession(0, 'invalid_user')).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for banned user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-ba`, connector)
    await expect(session.getSession(0, usersTyped.bannedAccount.username)).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for steam guard user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-sg`, connector)
    await expect(session.getSession(0, usersTyped.steamGuardAccount.username)).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
})

describe('getPlayerID', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return id for existing', async () => {
    session.session = emptySession
    session.session.last_heartbeat = (new Date()).toISOString()
    var playerId = await session.getPlayerID()
    expect(playerId).toBeTruthy()
    expect(playerId).toBe(emptySession.player_id)
    await wait(1)
  }, 20000)
  it('Should return id', async () => {
    var playerId = await session.getPlayerID()
    expect(playerId).toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for invalid user', async () => {
    expect.assertions(1)
    session = new Session(invalidType, connector)
    await expect(session.getPlayerID()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for banned user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-ba`, connector)
    await expect(session.getPlayerID()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for steam guard user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-sg`, connector)
    await expect(session.getPlayerID()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
})

describe('getJti', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return jti for existing', async () => {
    session.session = emptySession
    session.session.last_heartbeat = (new Date()).toISOString()
    var jti = await session.getJti()
    expect(jti).toBeTruthy()
    expect(jti).toBe(emptySession.jti)
    await wait(1)
  }, 20000)
  it('Should return jti', async () => {
    var jti = await session.getJti()
    expect(jti).toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for invalid user', async () => {
    expect.assertions(1)
    session = new Session(invalidType, connector)
    await expect(session.getJti()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for banned user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-ba`, connector)
    await expect(session.getJti()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should reject for steam guard user', async () => {
    expect.assertions(1)
    session = new Session(`${accountType}-sg`, connector)
    await expect(session.getJti()).rejects.toBeTruthy()
    await wait(1)
  }, 20000)
})

describe('stopSession', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  beforeAll(async () => {
    await db.connect()
  })
  beforeEach(async () => {
    connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
    for (var account of usersTyped.accounts) {
      await connector.addSteamUser(account.username, account.password, accountType)
    }
    await connector.addSteamUser(usersTyped.steamGuardAccount.username, usersTyped.steamGuardAccount.password, `${accountType}-sg`)
    await connector.addSteamUser(usersTyped.bannedAccount.username, usersTyped.bannedAccount.password, `${accountType}-ba`)
    session = new Session(accountType, connector)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should return for no session', async () => {
    session.session = undefined
    await session.stopSession()
    expect(session.session).toBeUndefined()
    await wait(1)
  }, 20000)
  it('Should return for old session', async () => {
    session.session = emptySession
    session.session.last_heartbeat = date.toISOString()
    await session.stopSession()
    expect(session.session).toBeUndefined()
    await wait(1)
  }, 20000)
  it('Should return for fake session', async () => {
    session.session = emptySession
    session.session.last_heartbeat = (new Date()).toISOString()
    await session.stopSession()
    expect(session.session).toBeUndefined()
    await wait(1)
  }, 20000)
  it('Should return for real session', async () => {
    var jti = await session.getJti()
    expect(jti).toBeTruthy()
    expect(session.session).toBeTruthy()
    await session.stopSession()
    expect(session.session).toBeUndefined()
    await wait(1)
  }, 20000)
})
