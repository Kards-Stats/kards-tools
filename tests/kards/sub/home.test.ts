import { MongoDBSteamUserConnector } from '../../../connectors'
import * as db from '../../helpers/db'
import users from '../users.json'
import { wait } from '../../helpers/utils'
import { Home } from '../../../kards/sub'
import { Requester, Session } from '../../../kards'
import { Debugger, logger as loggerImport } from '../../../includes'

const logger = loggerImport.getCurrentLogger('testing')

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
  var logger: Debugger
  var request: Requester
  beforeEach(async () => {
    logger = new Debugger()
    logger.level = logger.getLevelFromName('fatal')
    request = new Requester(logger)
  })
  it('Should create default with seperate loggers', async () => {
    var home = new Home()
    expect(home).toBeTruthy()
    expect(home.logger).toBeTruthy()
    expect(home.request).toBeTruthy()
    expect(home.logger.level).toBe(home.logger.getLevelFromName('warn'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('warn'))
    home.logger.level = home.logger.getLevelFromName('fatal')
    expect(home.logger.level).toBe(home.logger.getLevelFromName('fatal'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('warn'))
  })
  it('Should create default request with seperate loggers', async () => {
    var home = new Home(logger)
    expect(home).toBeTruthy()
    expect(home.logger).toBeTruthy()
    expect(home.request).toBeTruthy()
    expect(home.logger.level).toBe(home.logger.getLevelFromName('fatal'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('warn'))
    home.logger.level = home.logger.getLevelFromName('error')
    expect(home.logger.level).toBe(home.logger.getLevelFromName('error'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('warn'))
  })
  it('Should create default logger with seperate loggers', async () => {
    var home = new Home(undefined, request)
    expect(home).toBeTruthy()
    expect(home.logger).toBeTruthy()
    expect(home.request).toBeTruthy()
    expect(home.logger.level).toBe(home.logger.getLevelFromName('warn'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('fatal'))
    home.logger.level = home.logger.getLevelFromName('error')
    expect(home.logger.level).toBe(home.logger.getLevelFromName('error'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('fatal'))
  })
  it('Should create with values with same loggers', async () => {
    var home = new Home(logger, request)
    expect(home).toBeTruthy()
    expect(home.logger).toBeTruthy()
    expect(home.request).toBeTruthy()
    expect(home.logger.level).toBe(home.logger.getLevelFromName('fatal'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('fatal'))
    home.logger.level = home.logger.getLevelFromName('error')
    expect(home.logger.level).toBe(home.logger.getLevelFromName('error'))
    expect(home.request.logger.level).toBe(home.request.logger.getLevelFromName('error'))
  })
})

describe('getInfo', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var home: Home
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
    request = new Requester(undefined, session)
    home = new Home(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should get unauthenticated default', async () => {
    home = new Home(undefined, undefined)
    var info = await home.getInfo()
    expect(info).toBeTruthy()
    expect(info.current_user).toBeNull()
    expect(info.endpoints.my_client).toBeNull()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated', async () => {
    home = new Home(undefined, undefined)
    var info = await home.getInfo(false)
    expect(info).toBeTruthy()
    expect(info.current_user).toBeNull()
    expect(info.endpoints.my_client).toBeNull()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with invalid', async () => {
    var tempSession = new Session(invalidType, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var info = await home.getInfo(false)
    expect(info).toBeTruthy()
    expect(info.current_user).toBeNull()
    expect(info.endpoints.my_client).toBeNull()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with banned', async () => {
    var tempSession = new Session(`${accountType}-ba`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var info = await home.getInfo(false)
    expect(info).toBeTruthy()
    expect(info.current_user).toBeNull()
    expect(info.endpoints.my_client).toBeNull()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with steam guard', async () => {
    var tempSession = new Session(`${accountType}-sg`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var info = await home.getInfo(false)
    expect(info).toBeTruthy()
    expect(info.current_user).toBeNull()
    expect(info.endpoints.my_client).toBeNull()
    await wait(1)
  }, 10000)
  it('Should get authenticated', async () => {
    var info = await home.getInfo(true)
    expect(info).toBeTruthy()
    expect(info.current_user).toBeTruthy()
    expect(info.endpoints.my_client).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    home = new Home(undefined, undefined)
    if (home.request.session !== undefined) {
      home.request.session.hostname = 'https://doesntexist.ff'
    }
    home.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(home.getInfo(false)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('instance getSessionEndpoint', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var home: Home
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
    request = new Requester(undefined, session)
    home = new Home(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should get unauthenticated default', async () => {
    home = new Home(undefined, undefined)
    var endpoint = await home.getSessionEndpoint()
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with invalid', async () => {
    var tempSession = new Session(invalidType, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getSessionEndpoint()
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with banned', async () => {
    var tempSession = new Session(`${accountType}-ba`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getSessionEndpoint()
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with steam guard', async () => {
    var tempSession = new Session(`${accountType}-sg`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getSessionEndpoint()
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    home = new Home(undefined, undefined)
    if (home.request.session !== undefined) {
      home.request.session.hostname = 'https://doesntexist.ff'
    }
    home.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(home.getSessionEndpoint()).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('static getSessionEndpoint', () => {
  it('Should get session endpoint', async () => {
    var endpoint = await Home.getSessionEndpoint()
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('getEndpoint', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var home: Home
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
    request = new Requester(undefined, session)
    home = new Home(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should get unauthenticated default', async () => {
    home = new Home(undefined, undefined)
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with invalid', async () => {
    var tempSession = new Session(invalidType, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with banned', async () => {
    var tempSession = new Session(`${accountType}-ba`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get unauthenticated with steam guard', async () => {
    var tempSession = new Session(`${accountType}-sg`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject unauthenticated default', async () => {
    home = new Home(undefined, undefined)
    await expect(home.getEndpoint('my_player')).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject unauthenticated with invalid', async () => {
    var tempSession = new Session(invalidType, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    await expect(home.getEndpoint('my_player')).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject unauthenticated with banned', async () => {
    var tempSession = new Session(`${accountType}-ba`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    await expect(home.getEndpoint('my_player')).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject unauthenticated with steam guard', async () => {
    var tempSession = new Session(`${accountType}-sg`, connector)
    var tempRequest = new Requester(undefined, tempSession)
    home = new Home(undefined, tempRequest)
    await expect(home.getEndpoint('my_player')).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get authenticated', async () => {
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get authenticated after non authenticated', async () => {
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 20000)
  it('Should get authenticated after authenticated', async () => {
    var endpoint = await home.getEndpoint('my_client')
    expect(endpoint).toBeTruthy()
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    home = new Home(undefined, undefined)
    if (home.request.session !== undefined) {
      home.request.session.hostname = 'https://doesntexist.ff'
    }
    home.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(home.getEndpoint('root')).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('resetEndpoints', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var home: Home
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
    request = new Requester(undefined, session)
    home = new Home(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should do nothing', async () => {
    expect(home.resetEndpoints()).toBe(false)
    expect(home.resetEndpoints(false)).toBe(false)
    expect(home.resetEndpoints(true)).toBe(false)
  }, 10000)
  it('Should reset all', async () => {
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    expect(home.resetEndpoints(true)).toBe(true)
    expect(home.resetEndpoints(true)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should reset unauthorized', async () => {
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    expect(home.resetEndpoints(false)).toBe(true)
    expect(home.resetEndpoints(false)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should reset all after auth', async () => {
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    expect(home.resetEndpoints(true)).toBe(true)
    expect(home.resetEndpoints(true)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should reset authorized', async () => {
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    expect(home.resetEndpoints(false)).toBe(true)
    expect(home.resetEndpoints(false)).toBe(false)
    await wait(1)
  }, 10000)
})

describe('resetIfNew', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var home: Home
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
    request = new Requester(undefined, session)
    home = new Home(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should do nothing', async () => {
    expect(await home.resetIfNew(true)).toBe(false)
  }, 10000)
  it('Should do nothing with no session', async () => {
    home = new Home(undefined, undefined)
    expect(await home.resetIfNew()).toBe(false)
    expect(await home.resetIfNew(false)).toBe(false)
    expect(await home.resetIfNew(true)).toBe(false)
  }, 10000)
  it('Should reset all', async () => {
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    expect(await home.resetIfNew(true)).toBe(true)
    expect(await home.resetIfNew(true)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should reset all after auth', async () => {
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    expect(await home.resetIfNew(true)).toBe(true)
    expect(await home.resetIfNew(true)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should reset unauthorized', async () => {
    home = new Home(undefined, undefined)
    var endpoint = await home.getEndpoint('root')
    expect(endpoint).toBeTruthy()
    expect(await home.resetIfNew(false)).toBe(true)
    expect(await home.resetIfNew(false)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should keep for same user', async () => {
    var endpoint = await home.getEndpoint('my_player')
    expect(endpoint).toBeTruthy()
    expect(await home.resetIfNew(false)).toBe(false)
    expect(await home.resetIfNew(false)).toBe(false)
    await wait(1)
  }, 10000)
  it('Should keep for different user', async () => {
    home.logger.on('all', (...args: any[]) => {
      logger.warn(args)
    })
    logger.error('Should keep for different user')
    var endpoint = await home.getEndpoint('my_player')
    logger.error('Gotten endpoint')
    logger.error(endpoint)
    if (home.request.session !== undefined) {
      logger.error('session undefined')
      await home.request.session.logout()
      logger.error('session logged out')
      await home.request.session.stopSession()
      logger.error('session stopped')
    }
    logger.error('before first expect')
    expect(endpoint).toBeTruthy()
    logger.error('before first await expect')
    expect(await home.resetIfNew(false)).toBe(true)
    logger.error('before second await expect')
    expect(await home.resetIfNew(false)).toBe(false)
    logger.error('before await wait')
    await wait(1)
  }, 40000)
})
