import 'cross-fetch/polyfill'
import { ApolloClient, ApolloQueryResult, gql } from '@apollo/client/core'
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache'
import { DefaultOptions } from '@apollo/client'
import { getCurrentLogger } from '../includes/logger'
import { GameVersion } from '../types/kards-web'
import Keyv from 'keyv'

const logger = getCurrentLogger('includes-version')

const oneDay: number = 24 * 60 * 60 * 60 * 1000

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore'
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  }
}

export default class Version {
  public keyv: Keyv
  protected client: ApolloClient<NormalizedCacheObject>
  protected cacheTime: number
  protected key: string

  constructor (
    graphqlUri = 'https://api.kards.com/graphql',
    key = 'kards_version',
    cacheTime = oneDay,
    options = defaultOptions,
    cache = new InMemoryCache()
  ) {
    logger.silly('Generating version')
    this.keyv = new Keyv()
    this.client = new ApolloClient({
      uri: graphqlUri,
      cache: cache,
      defaultOptions: options
    })
    this.cacheTime = cacheTime
    this.key = key
  }

  async getVersion (): Promise<number | undefined> {
    var version = await this.keyv.get(this.key)
    if (version === undefined) {
      logger.silly('no version')
      var result: ApolloQueryResult<{
        currentGameVersion: GameVersion
      }> = await this.client.query({
        query: gql`
          query {
            currentGameVersion {
              id
            }
          }
        `
      })
      logger.debug(result)
      if (result.error != null || result.errors != null) {
        logger.error(result.error ?? result.errors)
        var errors = result.error?.message ?? ''
        for (var entry of result.errors ?? []) {
          errors += errors === '' ? entry.message : `, ${entry.message}`
        }
        throw new Error(errors)
      } else if (result.data.currentGameVersion === undefined || result.data.currentGameVersion.id === undefined) {
        logger.warn('No kards version found')
        return undefined
      } else {
        await this.keyv.set(this.key, result.data.currentGameVersion.id, oneDay)
        return result.data.currentGameVersion.id
      }
    } else {
      return version
    }
  }
}
