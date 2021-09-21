import { getCurrentLogger } from './src/includes/logger'
import users from './steam.json'
import mongoose from 'mongoose'
import { MongoDBSteamUserConnector, getMongooseConfig } from './src/connectors'

interface User {
  username: string
  password: string
  type: string
}

interface Users {
  accounts: User[]
}

const usersTyped: Users = users as Users

const logger = getCurrentLogger('add-steam-users')

mongoose.connect(getMongooseConfig(), { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  const connector = new MongoDBSteamUserConnector('SteamUser', mongoose.connection)
  for (var i = 0; i < usersTyped.accounts.length; i++) {
    const account = usersTyped.accounts[i]
    connector.addSteamUser(account.username, account.password, account.type, false).then((steamUser) => {
      if (steamUser === null) {
        logger.info(`Unable to save ${account.username}`)
      } else {
        logger.info(`Saved ${steamUser.username}`)
      }
    }).catch((e) => {
      logger.info(`Errored for ${account.username}`)
      logger.error(e)
    })
  }
}).catch((e) => {
  logger.error(e)
  process.exit(1)
})
