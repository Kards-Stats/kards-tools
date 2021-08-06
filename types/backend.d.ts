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

type Faction = 'Poland' | 'USA' | 'Britain' | 'Germany' | 'Soviet' | 'Japan' | 'France' | 'Italy' | 'Unknown'
type Rarity = 'Standard' | 'Limited' | 'Special' | 'Elite' | 'Unknown'
type CardType = 'order' | 'infantry' | 'artillery' | 'tank' | 'fighter' | 'bomber' | 'countermeasure' | 'unknown'

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

interface TurnValue {
  turn: number
  value: number
  card_id?: number
  card_name: string
  [key: string]: string | number | undefined
}

interface KreditValue {
  turn: number
  value: number
  card_id?: number
  card_name?: string
  reason?: string
  [key: string]: string | number | undefined
}

interface TargetValue {
  turn: number
  value: number
  from_card_type?: string
  from_card_id?: number
  from_card_name?: string
  to_card_id: number
  to_card_name: string
  [key: string]: string | number | undefined
}

interface LocationValue {
  turn: number
  card_id: number
  card_name?: string
  from: string
  to: string
  [key: string]: string | number | undefined
}

interface SideData {
  operation_cost?: TargetValue[]
  kredit_cost?: TargetValue[]
  attack?: TargetValue[]
  defense?: TargetValue[]
  ambush?: TargetValue[]
  blitz?: TargetValue[]
  fury?: TargetValue[]
  guard?: TargetValue[]
  immune?: TargetValue[]
  mobilize?: TargetValue[]
  smokescreen?: TargetValue[]
  enemies_pinned?: TargetValue[]
  self_pinned?: TargetValue[]
  units_unpinned?: TargetValue[]
  damage_done?: TargetValue[]
  self_damage_done?: TargetValue[]
  cards_seen?: TurnValue[]
  kredits?: KreditValue[]
  max_kredits?: KreditValue[]
  units_claimed?: TurnValue[]
  all_cards_played?: LocationValue[]
  units_played?: LocationValue[]
  orders_played?: LocationValue[]
  countermeasures_played?: TurnValue[]
  countermeasures_success?: TargetValue[]
  units_destroyed_unit?: TargetValue[]
  units_destroyed_order?: TargetValue[]
  units_destroyed_self?: TargetValue[]
  units_destroyed_unknown?: TargetValue[]
  fatigue_damage?: TurnValue[]
  cards_drawn?: TurnValue[]
  cards_discarded_hand?: TargetValue[]
  cards_discarded_board?: TargetValue[]
  cards_self_discarded_hand?: TargetValue[]
  cards_self_discarded_board?: TargetValue[]
  units_to_frontline?: LocationValue[]
  units_to_backline?: LocationValue[]
  units_to_hand?: LocationValue[]
  units_spawned?: LocationValue[]
  card_definitions?: CardDefinition[]
  faction_details?: FactionDetails
  [key: string]: Array<LocationValue | TargetValue | TurnValue | KreditValue | CardDefinition> | FactionDetails | undefined
}

interface MatchData {
  match_id: number
  bot_match: boolean
  version: number
  player_id_left?: number
  player_id_right?: number
  start_side: string
  winner_side: string
  winner_reason: string
  end_on_turn: number
  left: SideData
  right: SideData
}

interface PendingCards {
  side: string
  cardID: number
  action: string
  index: number
  field: string
  typeField?: string
}

interface CurrentMarker {
  cardID?: number
  cardName?: string
  lastActionCardID?: number
  lastAction?: string
}

interface ClaimedStatus {
  [key: string]: boolean
}

interface CardDefinition {
  game_name: string
  faction: Faction
  type: CardType
  isExile: boolean
  rarity: Rarity
  playedIDs: number[]
  [key: string]: string | number[] | boolean | undefined
}

interface FactionDetails {
  main_faction: string
  ally_faction: string
  confident: boolean
  [key: string]: string | boolean
}

export {
  Keyable,
  Language,
  Card,
  Cards,
  Faction,
  Rarity,
  CardType,
  SteamUser,
  MatchData,
  SideData,
  LocationValue,
  KreditValue,
  TargetValue,
  TurnValue,
  PendingCards,
  CurrentMarker,
  ClaimedStatus,
  CardDefinition,
  FactionDetails
}
