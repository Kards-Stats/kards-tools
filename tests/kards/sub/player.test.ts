import { MongoDBSteamUserConnector } from '../../../connectors'
import * as db from '../../helpers/db'
import users from '../users.json'
import { wait } from '../../helpers/utils'
import { Player } from '../../../kards/sub'
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

const friendId = 510317
const friendName = 'KlutzyBubbles'
const friendTag = 3097

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
    var player = new Player()
    expect(player).toBeTruthy()
    expect(player.logger).toBeTruthy()
    expect(player.request).toBeTruthy()
    expect(player.logger.level).toBe(player.logger.getLevelFromName('warn'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('warn'))
    player.logger.level = player.logger.getLevelFromName('fatal')
    expect(player.logger.level).toBe(player.logger.getLevelFromName('fatal'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('warn'))
  })
  it('Should create default request with seperate loggers', async () => {
    var player = new Player(logger)
    expect(player).toBeTruthy()
    expect(player.logger).toBeTruthy()
    expect(player.request).toBeTruthy()
    expect(player.logger.level).toBe(player.logger.getLevelFromName('fatal'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('warn'))
    player.logger.level = player.logger.getLevelFromName('error')
    expect(player.logger.level).toBe(player.logger.getLevelFromName('error'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('warn'))
  })
  it('Should create default logger with seperate loggers', async () => {
    var player = new Player(undefined, request)
    expect(player).toBeTruthy()
    expect(player.logger).toBeTruthy()
    expect(player.request).toBeTruthy()
    expect(player.logger.level).toBe(player.logger.getLevelFromName('warn'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('fatal'))
    player.logger.level = player.logger.getLevelFromName('error')
    expect(player.logger.level).toBe(player.logger.getLevelFromName('error'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('fatal'))
  })
  it('Should create with values with same loggers', async () => {
    var player = new Player(logger, request)
    expect(player).toBeTruthy()
    expect(player.logger).toBeTruthy()
    expect(player.request).toBeTruthy()
    expect(player.logger.level).toBe(player.logger.getLevelFromName('fatal'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('fatal'))
    player.logger.level = player.logger.getLevelFromName('error')
    expect(player.logger.level).toBe(player.logger.getLevelFromName('error'))
    expect(player.request.logger.level).toBe(player.request.logger.getLevelFromName('error'))
  })
})

describe('addFriendById', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var player: Player
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
    player = new Player(undefined, request)
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
    player = new Player(undefined, undefined)
    await expect(player.addFriendById(friendId)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid player id', async () => {
    await expect(player.addFriendById(-1)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should add friend', async () => {
    var friend = await player.addFriendById(friendId)
    expect(friend).toBeTruthy()
    expect(friend.friend_id).toBe(friendId)
    await wait(1)
  }, 10000)
  it('Should reject for self id', async () => {
    await expect(player.addFriendById(await session.getPlayerID())).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (player.request.session !== undefined) {
      player.request.session.hostname = 'https://doesntexist.ff'
    }
    player.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(player.addFriendById(friendId)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('addFriendByName', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var player: Player
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
    player = new Player(undefined, request)
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
    player = new Player(undefined, undefined)
    await expect(player.addFriendByName(friendName, friendTag)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid player name', async () => {
    await expect(player.addFriendByName(friendName, -1)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should add friend', async () => {
    var friend = await player.addFriendByName(friendName, friendTag)
    expect(friend).toBeTruthy()
    expect(friend.friend_id).toBe(friendId)
    await wait(1)
  }, 10000)
  it('Should reject for self name', async () => {
    var name = await session.getValue('player_name')
    var tag = await session.getValue('player_tag')
    expect(typeof name).toBe('string')
    expect(typeof tag).toBe('number')
    if (typeof name === 'string' && typeof tag === 'number') {
      await expect(player.addFriendByName(name, tag)).rejects.toBeTruthy()
    }
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (player.request.session !== undefined) {
      player.request.session.hostname = 'https://doesntexist.ff'
    }
    player.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(player.addFriendByName(friendName, friendTag)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('getPlayerName', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var player: Player
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
    player = new Player(undefined, request)
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
    player = new Player(undefined, undefined)
    await expect(player.getPlayerName(friendId)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid player id', async () => {
    await expect(player.getPlayerName(-1)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get friend name', async () => {
    var friend = await player.getPlayerName(friendId)
    expect(friend).toBeTruthy()
    expect(friend).toBe(`${friendName}#${friendTag}`)
    await wait(1)
  }, 10000)
  it('Should get for self id', async () => {
    var self = await player.getPlayerName(await session.getPlayerID())
    var name = await session.getValue('player_name')
    var tag = await session.getValue('player_tag')
    expect(self).toBeTruthy()
    expect(typeof name).toBe('string')
    expect(typeof tag).toBe('number')
    if (typeof name === 'string' && typeof tag === 'number') {
      expect(self).toBe(`${name}#${tag}`)
    }
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (player.request.session !== undefined) {
      player.request.session.hostname = 'https://doesntexist.ff'
    }
    player.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(player.getPlayerName(friendId)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('getPlayerId', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var player: Player
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
    player = new Player(undefined, request)
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
    player = new Player(undefined, undefined)
    await expect(player.getPlayerId(friendName, friendTag)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should reject for invalid player name', async () => {
    var friend = await player.getPlayerId(friendName, -1)
    expect(friend).toBeUndefined()
    await wait(1)
  }, 10000)
  it('Should get friend id', async () => {
    var friend = await player.getPlayerId(friendName, friendTag)
    expect(friend).toBeTruthy()
    expect(friend).toBe(friendId)
    await wait(1)
  }, 10000)
  it('Should get for self name', async () => {
    var name = await session.getValue('player_name')
    var tag = await session.getValue('player_tag')
    expect(typeof name).toBe('string')
    expect(typeof tag).toBe('number')
    if (typeof name === 'string' && typeof tag === 'number') {
      var self = await player.getPlayerId(name, tag)
      expect(self).toBeTruthy()
      expect(self).toBe(await player.request.session?.getPlayerID())
    }
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (player.request.session !== undefined) {
      player.request.session.hostname = 'https://doesntexist.ff'
    }
    player.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(player.getPlayerId(friendName, friendTag)).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})

describe('getFriends', () => {
  var connector: MongoDBSteamUserConnector
  var session: Session
  var request: Requester
  var player: Player
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
    player = new Player(undefined, request)
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
    player = new Player(undefined, undefined)
    await expect(player.getFriends()).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
  it('Should get friends', async () => {
    await player.addFriendById(friendId)
    const friends = await player.getFriends()
    expect(friends).toBeTruthy()
    expect(friends.length).toBeGreaterThan(0)
    await wait(1)
  }, 10000)
  it('Should reject for no connect', async () => {
    if (player.request.session !== undefined) {
      player.request.session.hostname = 'https://doesntexist.ff'
    }
    player.request.hostnameDefault = 'https://doesntexist.ff'
    await expect(player.getFriends()).rejects.toBeTruthy()
    await wait(1)
  }, 10000)
})
