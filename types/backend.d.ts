interface Keyable {
  [key: string]: any
}

interface Language {
  de: string
  en: string
  es: string
  fr: string
  it: string
  pl: string
  pt: string
  ru: string
  zh: string
}

type Faction = 'Poland' | 'USA' | 'Britain' | 'Germany' | 'Soviet' | 'Japan' | 'France' | 'Italy'
type Rarity = 'Standard' | 'Limited' | 'Special' | 'Elite'
type CardType = 'order' | 'infantry' | 'artillery' | 'tank' | 'fighter' | 'bomber' | 'countermeasure'

interface Card {
  id: number
  card_id: string
  game_id: string
  version: number
  set: string
  text: Language
  type: CardType
  image: string
  image_url: Language
  thumb_url: Language
  title: Language
  attack?: number
  rarity: Rarity
  defense?: number
  faction: Faction
  kredits: number
  import_id: string
  attributes: string[]
  operation_cost: number
}

interface Cards {
  count: number
  cards: Card[]
}

interface SteamUser {
  username: string
  password: string
  type: string
  steam_id?: string
  ticket?: string
  banned: boolean
  last_steam_login: Date
  last_kards_login: Date
}

export {
  Keyable,
  Language,
  Card,
  Cards,
  Faction,
  Rarity,
  CardType,
  SteamUser
}
