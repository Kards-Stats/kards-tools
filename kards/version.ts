import 'cross-fetch/polyfill'
import { ApolloClient, ApolloQueryResult, gql } from '@apollo/client/core'
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache'
import { DefaultOptions } from '@apollo/client'
import { getCurrentLogger } from '../includes/logger'
import { GameVersion } from '../types/kards-web'
import Q from 'q'
import winston from 'winston'
import Keyv from 'keyv'

const logger: winston.Logger = getCurrentLogger('includes-version')

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
    const deferred = Q.defer()
    this.keyv.get(this.key).then((version: number | undefined) => {
      if (version === undefined) {
        logger.silly('no version')
        this.client.query({
          query: gql`
            query {
              currentGameVersion {
                id
              }
            }
          `
        }).then((result: ApolloQueryResult<{
          currentGameVersion: GameVersion
        }>) => {
          logger.debug(result)
          if (result.error != null || result.errors != null) {
            logger.error(result.error ?? result.errors)
            return deferred.reject(result.error ?? result.errors)
          } else if (result.data.currentGameVersion === undefined || result.data.currentGameVersion.id === undefined) {
            logger.warn('No kards version found')
            return deferred.resolve(undefined)
          } else {
            this.keyv.set(this.key, result.data.currentGameVersion.id, oneDay).then(() => {
              return deferred.resolve(result.data.currentGameVersion.id)
            }).catch((e) => {
              return deferred.reject(e)
            })
          }
        }).catch((e) => {
          logger.error(e)
          return deferred.reject(e)
        })
      } else {
        return deferred.resolve(version)
      }
    }).catch((e) => {
      return deferred.reject(e)
    })
    return deferred.promise as any as Promise<number | undefined>
  }
}
