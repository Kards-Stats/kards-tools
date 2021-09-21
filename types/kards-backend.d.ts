type MatchStatus = 'running' | 'finished' | 'orphaned' | 'not_found'

interface LoginReward {
  day: number
  reset: string
  seconds: number
}

interface Session {
  achievements_url: string
  britain_level: number
  britain_xp: number
  client_id: number
  client_url: string
  dailymissions_url: string
  decks_url: string
  draft_admissions: number
  dust: number
  email: string
  email_reward_received: boolean
  email_verified: boolean
  germany_level: number
  germany_xp: number
  gold: number
  has_been_officer: boolean
  heartbeat_url: string
  is_officer: boolean
  is_online: boolean
  japan_level: number
  japan_xp: number
  jti: string
  jwt: string
  last_daily_mission_cancel: null
  last_daily_mission_renewal: string
  last_heartbeat?: string
  last_logon_date: string
  launch_messages: string[]
  library_url: string
  new_cards: string[]
  new_player_login_reward: LoginReward
  npc: boolean
  online_flag: boolean
  packs_url: string
  player_id: number
  player_name: string
  player_tag: number
  player_url: string
  rewards: string[]
  season_end: string
  season_wins: number
  server_time: string
  soviet_level: number
  soviet_xp: number
  stars: number
  tutorials_done: number
  tutorials_finished: string[]
  usa_level: number
  usa_xp: number
  user_id: number
  user_url: string
}

interface BuildInfo {
  build_timestamp: string
  commit_hash: string
  version: string
}

interface HomeUser {
  client_id: number
  exp: number
  iat: number
  identity_id: number
  iss: string
  jti: string
  player_id: number
  roles: string[]
  tenant: string
  tier: string
  user_id: number
  user_name: string
}

interface Endpoints {
  clients: string
  draft: string
  email: string
  lobbyplayers: string
  matches: string
  matches2: string
  my_client?: string
  my_draft?: string
  my_items?: string
  my_player?: string
  my_user?: string
  players: string
  root: string
  session: string
  store: string
  tourneys: string
  transactions: string
  'user-identities': string
  user_identities: string
  users: string
}

interface HostInfo {
  container_name: string
  docker_image: string
  host_address: string
  host_name: string
  instance_id: string
}

interface Home {
  build_info: BuildInfo
  current_user?: HomeUser
  endpoints: Endpoints
  host_info: HostInfo
  server_time: string
  service_name: string
  tenant_name: string
  tier_name: string
}

interface Config {
  UnitWeightEffect: boolean
  allow_breakthrough_craft: boolean
  allow_release_bg: boolean
  blueprint_board: boolean
  breakthrough_set: boolean
  campaign2020: boolean
  campaign2020_cards: boolean
  campaign_lock: boolean
  campaign_test: boolean
  christmas: boolean
  christmas_banner: boolean
  disable_start_turn_check: boolean
  dlc: boolean
  email: boolean
  enable_chat: boolean
  enable_offer_countdown: boolean
  expansion_factions: boolean
  history_turns: boolean
  idel_disconnect_minutes: number
  localization: boolean
  localization_feedback_url: string
  most_popular_products: string
  pvp_sendstate: boolean
  reconnect: boolean
  review_lost: number
  review_url_de: string
  review_url_en: string
  review_url_fr: string
  review_url_pl: string
  review_url_pt: string
  review_url_ru: string
  review_url_zh: string
  review_wins: number
  stop_cleanup_after_turn: boolean
  use_visual_queue: boolean
  versions: string[]
  wc_button: boolean
  wc_discord_url: string
  wc_facebook_url: string
  wc_season_id: 7
  wc_steam_url: string
  wc_twitter_url: string
  websocket_matchactions: boolean
  websocket_notifications: boolean
  websocketurl: string
  xdisable_review_window: boolean
  xserver_closed: string
  xserver_closed_header: string
  new_rank: boolean
  radar_search: boolean
  new_start_turn_message: boolean
  new_encyclopedia: boolean
  new_battle_intro: boolean
  import_deck: boolean
  deck_labels: boolean
  old_card_look: boolean
  show_alphine_and_mobilize_in_encyclopedia: boolean
  stop_ally_elites: boolean
  new_frontline: boolean
  new_seasonal_rewards: boolean
  new_target_arrow: boolean
  match_refactor: boolean
  enable_draft_button: boolean
  hide_friend_button: boolean
  easter_blitz: boolean
  double_xp: boolean
  legions_set: boolean
  new_spring_faction: boolean
  allow_legions_craft: boolean
  polish_board: boolean
  polish_song: boolean
  polloptimization: boolean
  [key: string]: any
}

interface MatchInfo {
  player_status_left?: string
  player_status_right?: string
  status: string
}

interface Match {
  actions: XAction[]
  match?: MatchInfo
}

interface ActionData {
  reason?: string
  winner_side?: string
  cardID?: number
  card_name?: string
  enterPlayOnTurn?: number
  location?: string
  locationNumber?: number
  side?: string
  attackerCardID?: number
  attacker_card_name?: string
  defenderCardID?: number
  defender_card_name?: string
  cardSelectingTarget?: number
  targetCard?: number
  [key: string]: any
}

interface XAction {
  action_id: number
  action_type: string
  player_id: number
  side: string
  sub_actions?: ZAction[] | null
  turn_number: number
  action_data: ActionData
}

interface ZAction {
  attackerAttackLeft?: number
  attackerCardID?: number
  attackerDefense?: number
  attackerDestroyed?: number
  attackerHasEverAttacked?: number
  attackerLocation?: string
  attackerMovementLeft?: number
  damageAttacker?: number
  damageDefender?: number
  defenderCardID?: number
  defenderDefense?: number
  defenderDestroyed?: number
  defenderLocation?: string
  name: string
  newKredits?: number
  newMaxKredits?: number
  oldKredits?: number
  oldMaxKredits?: number
  newResources?: number
  newMaxResources?: number
  oldResources?: number
  oldMaxResources?: number
  side?: string
  triggerCardID?: number
  cardID?: number
  customJson?: string
  customJson1?: string
  customJson2?: string
  duration?: number
  gained?: number
  instigatorID?: number
  isBuff?: number
  newAttackValue?: number
  enterPlayOnTurn?: number
  location?: string
  locationNumber?: number
  nonVisualLocationNumber?: number
  targetCardID?: number
  cardType?: string | number
  skipDrawAnimation?: number
  spawnInHand?: number
  oldLocation?: string
  effect?: string
  newDefenseValue?: number
  oldDefense?: number
  damage?: number
  destroyed?: number | string
  discarderID?: number
  costToAdd?: number
  lost?: number
  cardIDs?: number | string
  damageReceived?: string
  damageReceiverIDs?: string
  destroyerCardID?: number
  destroyerID?: number
  cardsToDestroy?: string
  newLocation?: string
  newLocationNumber?: number
  [key: string]: any
}

interface FriendListItem {
  busy_status: string | null
  is_online: boolean
  player_id: number
  player_name: string
  player_tag: number
  status: string
}

interface FriendId {
  friend_id: number
}

export {
  Config,
  Home,
  HomeUser,
  Endpoints,
  BuildInfo,
  HostInfo,
  Session,
  LoginReward,
  Match,
  XAction,
  ZAction,
  MatchInfo,
  ActionData,
  MatchStatus,
  FriendListItem,
  FriendId
}
