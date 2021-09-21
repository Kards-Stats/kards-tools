import 'cross-fetch/polyfill'
import { ApolloClient, ApolloQueryResult, gql } from '@apollo/client/core'
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache'
import { DefaultOptions } from '@apollo/client'
import Debugger from '../includes/debugger'
import { GameVersion } from '../../types/kards-web'

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
  protected client: ApolloClient<NormalizedCacheObject>
  protected key: string
  public logger: Debugger
  protected version: number | undefined

  constructor (
    graphqlUri = 'https://api.kards.com/graphql',
    key = 'kards_version',
    options = defaultOptions,
    cache = new InMemoryCache(),
    logger?: Debugger
  ) {
    this.logger = logger ?? new Debugger()
    this.logger.silly('Generating version')
    this.client = new ApolloClient({
      uri: graphqlUri,
      cache: cache,
      defaultOptions: options
    })
    this.key = key
  }

  async getVersion (): Promise<number | undefined> {
    if (this.version === undefined) {
      this.logger.silly('no version')
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
      this.logger.debug(result)
      if (result.error != null || result.errors != null) {
        this.logger.error(result.error ?? result.errors)
        var errors = result.error?.message ?? ''
        for (var entry of result.errors ?? []) {
          errors += errors === '' ? entry.message : `, ${entry.message}`
        }
        throw new Error(errors)
      } else if (result.data.currentGameVersion === undefined || result.data.currentGameVersion.id === undefined) {
        this.logger.warn('No kards version found')
        return undefined
      } else {
        this.version = result.data.currentGameVersion.id
        return result.data.currentGameVersion.id
      }
    } else {
      return this.version
    }
  }
}
