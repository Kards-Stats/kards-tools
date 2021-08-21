import 'cross-fetch/polyfill'
import { ApolloClient, gql } from '@apollo/client/core'
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache'
import { DefaultOptions } from '@apollo/client'
import { getCurrentLogger } from '../includes/logger'
import Q from 'q'
import { Card as CardType, Cards as CardsType } from '../types/backend'
import winston from 'winston'
import Keyv from 'keyv'

const logger: winston.Logger = getCurrentLogger('backend-card')

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

export default class Cards {
  keyv: Keyv
  client: ApolloClient<NormalizedCacheObject>
  version: number
  key: string
  cacheTime: number

  constructor (
    version: number,
    backendUri = 'https://kards-dt-backend.herokuapp.com/',
    cacheTime = oneDay,
    options = defaultOptions,
    cache = new InMemoryCache()
  ) {
    logger.silly('Generating cards')
    this.keyv = new Keyv({ namespace: version.toString() })
    this.client = new ApolloClient({
      uri: backendUri,
      cache: cache,
      defaultOptions: options
    })
    this.cacheTime = cacheTime
    this.version = version
    this.key = `card_list_${this.version}`
  }

  async getCard (gameID: string): Promise<CardType | undefined> {
    const deferred = Q.defer()
    this.getCards().then((cards) => {
      if (cards !== undefined) {
        if (gameID.endsWith('_cam1')) {
          gameID = gameID.split('_cam1')[0]
          logger.debug(`Found card with _cam1, new name ${gameID}`)
        }
        for (var card of cards.cards) {
          if (card.game_id === gameID) { return deferred.resolve(card) }
        }
      }
      return deferred.resolve(undefined)
    }).catch((e) => {
      logger.error(e)
      return deferred.reject(e)
    })
    return await (deferred.promise as any as Promise<CardType | undefined>)
  }

  async getCards (): Promise<CardsType | undefined> {
    const deferred = Q.defer()
    this.keyv.get(this.key).then((cards) => {
      if (cards === undefined) {
        logger.silly('no cards')
        this.client.query({
          query: gql`
            query ($version: Int!) {
              allCards(version: $version) {
                ... on CardList {
                  cards {
                    card_id
                    game_id
                    version
                    set
                    type
                    attack
                    defense
                    rarity
                    faction
                    kredits
                    import_id
                    attributes
                    operation_cost
                  }
                }
                ... on Error {
                  code
                  error
                }
              }
            }
          `,
          variables: {
            version: this.version
          }
        }).then((result) => {
          logger.silly(result)
          if ((result.error != null) || (result.errors != null)) {
            // There was an error
            logger.error(result.error ?? result.errors)
            return deferred.reject(result.error ?? result.errors)
          } else if (result.data.allCards.cards === undefined || result.data.allCards.cards.length < 1) {
            // Cards list empty, maybe wrong version
            logger.warn(`No cards found for version ${this.version}`)
            return deferred.resolve(undefined)
          } else {
            // Cards are ready to be inserted
            const data: CardsType = {
              count: result.data.allCards.cards.length,
              cards: result.data.allCards.cards
            }
            this.keyv.set(this.key, data, this.cacheTime).then(() => {
              return deferred.resolve(data)
            }).catch((e) => {
              return deferred.reject(e)
            })
          }
        }).catch((e) => {
          logger.error(e)
          return deferred.reject(e)
        })
      } else {
        return deferred.resolve(cards)
      }
    }).catch((e) => {
      return deferred.reject(e)
    })
    return await (deferred.promise as any as Promise<CardsType | undefined>)
  }
}
