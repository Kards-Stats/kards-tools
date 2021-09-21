import 'cross-fetch/polyfill'
import { ApolloClient, gql } from '@apollo/client/core'
import { InMemoryCache, NormalizedCacheObject } from '@apollo/client/cache'
import { DefaultOptions } from '@apollo/client'
import { Card as CardType, Cards as CardsType } from '../../types/backend'
import Debugger from '../includes/debugger'

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
  client: ApolloClient<NormalizedCacheObject>
  version: number
  key: string
  cards: CardsType | undefined
  public logger: Debugger

  constructor (
    version: number,
    backendUri = 'https://kards-dt-backend.herokuapp.com/',
    options = defaultOptions,
    cache = new InMemoryCache(),
    logger?: Debugger
  ) {
    this.logger = logger ?? new Debugger()
    this.logger.silly(`Cards(${version}, ${backendUri}, ${JSON.stringify(options)})`)
    this.client = new ApolloClient({
      uri: backendUri,
      cache: cache,
      defaultOptions: options
    })
    this.version = version
    this.key = `card_list_${this.version}`
  }

  async getCard (gameID: string): Promise<CardType | undefined> {
    this.logger.silly(`getCards(${gameID})`)
    var cards = await this.getCards()
    if (cards !== undefined) {
      if (gameID.endsWith('_cam1')) {
        gameID = gameID.split('_cam1')[0]
        this.logger.debug(`Found card with _cam1, new name ${gameID}`)
      }
      for (var card of cards.cards) {
        if (card.game_id === gameID) {
          this.logger.debug(`found card for ${gameID}`)
          this.logger.debug(card)
          return card
        }
      }
    }
    return undefined
  }

  async getCards (): Promise<CardsType | undefined> {
    this.logger.silly('getCards()')
    if (this.cards === undefined) {
      this.logger.silly('no cards')
      var result = await this.client.query({
        query: gql`
          query ($version: Int!) {
            allCards(version: $version) {
              ... on CardList {
                cards {
                  id
                  card_id
                  game_id
                  version
                  image
                  set
                  type
                  text {
                    de
                    en
                    es
                    fr
                    it
                    pl
                    pt
                    ru
                    zh
                  }
                  title {
                    de
                    en
                    es
                    fr
                    it
                    pl
                    pt
                    ru
                    zh
                  }
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
      })
      this.logger.silly(result)
      if (result.error !== undefined || result.errors !== undefined) {
        // There was an error
        this.logger.error(result.error ?? result.errors)
        var errors = result.error?.message ?? ''
        for (var entry of result.errors ?? []) {
          errors += errors === '' ? entry.message : `, ${entry.message}`
        }
        throw new Error(errors)
      } else if (result.data.allCards.cards === undefined || result.data.allCards.cards.length < 1) {
        // Cards list empty, maybe wrong version
        this.logger.warn(`No cards found for version ${this.version}`)
        return undefined
      } else {
        // Cards are ready to be inserted
        const data: CardsType = {
          count: result.data.allCards.cards.length,
          cards: result.data.allCards.cards
        }
        this.cards = data
        return data
      }
    } else {
      return this.cards
    }
  }
}
