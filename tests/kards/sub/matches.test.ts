import { MongoDBSteamUserConnector } from '../../../connectors'
import * as db from '../../helpers/db'
import users from '../users.json'
import { wait } from '../../helpers/utils'
import { Matches } from '../../../kards/sub'
import { Requester, Session } from '../../../kards'
import { Debugger } from '../../../includes'

interface User {
  username: string
  password: string
}

interface Users {
  accounts: User[]
  steamGuardAccount: User
  bannedAccount: User
}

/*
37030000 - Orphaned
37033333 - Finished
99999999 - Not Found (for a while)
*/
const orphaned = 37030000
const finished = 37033333
const notFound = 99999999

const usersTyped: Users = users as Users
const accountType: string = 'test-type'

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
    var matches = new Matches()
    expect(matches).toBeTruthy()
    expect(matches.logger).toBeTruthy()
    expect(matches.request).toBeTruthy()
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('warn'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('warn'))
    matches.logger.level = matches.logger.getLevelFromName('fatal')
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('fatal'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('warn'))
  })
  it('Should create default request with seperate loggers', async () => {
    var matches = new Matches(logger)
    expect(matches).toBeTruthy()
    expect(matches.logger).toBeTruthy()
    expect(matches.request).toBeTruthy()
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('fatal'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('warn'))
    matches.logger.level = matches.logger.getLevelFromName('error')
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('error'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('warn'))
  })
  it('Should create default logger with seperate loggers', async () => {
    var matches = new Matches(undefined, request)
    expect(matches).toBeTruthy()
    expect(matches.logger).toBeTruthy()
    expect(matches.request).toBeTruthy()
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('warn'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('fatal'))
    matches.logger.level = matches.logger.getLevelFromName('error')
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('error'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('fatal'))
  })
  it('Should create with values with same loggers', async () => {
    var matches = new Matches(logger, request)
    expect(matches).toBeTruthy()
    expect(matches.logger).toBeTruthy()
    expect(matches.request).toBeTruthy()
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('fatal'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('fatal'))
    matches.logger.level = matches.logger.getLevelFromName('error')
    expect(matches.logger.level).toBe(matches.logger.getLevelFromName('error'))
    expect(matches.request.logger.level).toBe(matches.request.logger.getLevelFromName('error'))
  })
})

describe('getMatchStatus', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var matches: Matches
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
    matches = new Matches(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should reject for no session', async () => {
    matches = new Matches(undefined, undefined)
    await expect(matches.getMatchStatus(finished)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid match id', async () => {
    await expect(matches.getMatchStatus(-1)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get finished', async () => {
    var status = await matches.getMatchStatus(finished)
    expect(status).toBeTruthy()
    expect(status).toBe('finished')
    await wait(1)
  }, 10000)
  it('Should get not found', async () => {
    var status = await matches.getMatchStatus(notFound)
    expect(status).toBeTruthy()
    expect(status).toBe('not_found')
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (matches.request.session !== undefined) {
      matches.request.session.hostname = 'https://doesntexist.ff'
    }
    matches.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(matches.getMatchStatus(finished)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('getMatchData', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var matches: Matches
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
    matches = new Matches(undefined, request)
  })
  afterEach(async () => {
    await session.logout()
    await session.stopSession()
    await db.clearDatabase()
  }, 20000)
  afterAll(async () => {
    await db.closeDatabase()
  })
  it('Should reject for no session', async () => {
    matches = new Matches(undefined, undefined)
    await expect(matches.getMatchData(finished)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid match id', async () => {
    await expect(matches.getMatchData(-1)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get finished', async () => {
    var data = await matches.getMatchData(finished)
    expect(data).toBeTruthy()
    expect(data.actions).toBeTruthy()
    expect(data.match).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get orphaned', async () => {
    var data = await matches.getMatchData(orphaned)
    expect(data).toBeTruthy()
    expect(data.actions).toBeTruthy()
    expect(data.match).toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for not found', async () => {
    await expect(matches.getMatchData(notFound)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (matches.request.session !== undefined) {
      matches.request.session.hostname = 'https://doesntexist.ff'
    }
    matches.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(matches.getMatchData(finished)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})