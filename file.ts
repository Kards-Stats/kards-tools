// import { MongoDBSteamUserConnector } from './connectors'
// import * as db from './tests/helpers/db'
// import { KardsSession } from './kards'
// import { getCurrentLogger } from './includes/logger'
// import { Session } from './types/kards-backend'
// // import { getKardsSessionEndpoint } from './kards/endpoints'
//
// const logger = getCurrentLogger('test')
//
// interface User {
//   username: string
//   password: string
// }
//
// const user: User = {
//   username: 'kards_test_user1',
//   password: 'kolif7#AN4zuP#MFA9Au'
// }
// const accountType: string = 'test-type';
//
// (async () => {
//   try {
//     var connector: MongoDBSteamUserConnector
//     var session: KardsSession
//     await db.connect()
//     connector = new MongoDBSteamUserConnector('SteamUser', db.getConnection())
//     await connector.addSteamUser(user.username, user.password, accountType)
//     session = new KardsSession(accountType, connector)
//     try {
//       // var ticket = await session.refreshSteam(user.username, false, 5000)
//       // var playerId = await session.getPlayerID()
//       // console.log(playerId)
//       session.session = undefined
//       var promises: Array<Promise<Session>> = []
//       promises.push(session.getSession())
//       await new Promise(resolve => setTimeout(resolve, 0))
//       promises.push(session.getSession())
//       await Promise.all(promises)
//       await new Promise(resolve => setTimeout(resolve, 1000))
//       await session.stopSession()
//     } catch (e) {
//       logger.error('user catch')
//       logger.error(e)
//       console.error(e)
//     }
//     /*
//     var ticket = await session.refreshSteam(usersTyped.accounts[1].username, 5000)
//     expect(ticket).toBe('')
//     await new Promise(resolve => setTimeout(resolve, 5000))
//     var ticket = await session.refreshSteam(usersTyped.accounts[1].username, 5000)
//     expect(ticket).toBeTruthy()
//     */
//   } catch (e) {
//     logger.error('Main Catch')
//     logger.error(e)
//     console.error(e)
//   } finally {
//     await db.clearDatabase()
//     await db.closeDatabase()
//     // process.exit(1)
//   }
//   console.log('REACH')
// })().catch((e) => {
//   logger.error('Super Main Catch')
//   logger.error(e)
//   console.log(e)
//   process.exit(1)
// })
//
// /*
// (async () => {
//   console.log(await getKardsSessionEndpoint())
//   process.exit(0)
// })().catch((e) => {
//   logger.error('Super Main Catch')
//   logger.error(e)
//   console.error(e)
//   process.exit(1)
// })
// */

// import users from './tests/kards/users.json'

// console.log(JSON.stringify(users))

import { includes, connectors } from './src/index'
import { getMongooseConfig } from './src/connectors'
import mongoose from 'mongoose'
import { Version, Session } from './src/kards'

const logger = includes.logger.getCurrentLogger('save-match')

const sessionName = 'save-match'
var session: Session | undefined

const version = new Version()

mongoose.connect(getMongooseConfig(), { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  // session = new Session(sessionName, getSteamUserConnector())
  session = new Session(sessionName, new connectors.MongoDBSteamUserConnector('SteamUser', mongoose.connection))
  logger.info('Preparing authentication...')
  session.getJti().then(() => {
    logger.info('Preparing version...')
    version.getVersion().then((versionNumber) => {
      if (versionNumber !== undefined && versionNumber !== null) {
        logger.info('Preparing SQS...')
        process.exit(0)
      } else {
        logger.error(new Error('No version number generated'))
        process.exit(1)
      }
    }).catch((e) => {
      logger.error(e)
      process.exit(1)
    })
  }).catch((e) => {
    logger.error(e)
    process.exit(1)
  })
}).catch((e) => {
  logger.error(e)
  process.exit(1)
})
