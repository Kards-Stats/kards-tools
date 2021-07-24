export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** Date custom scalar type */
  Date: any
  JSON: any
}

export interface ActionPayload {
  __typename?: 'ActionPayload'
  error?: Maybe<Scalars['String']>
}

export interface Card {
  __typename?: 'Card'
  id: Scalars['Int']
  cardId: Scalars['String']
  importId?: Maybe<Scalars['String']>
  json: Scalars['JSON']
  nation: Nation
  image: Scalars['String']
  resources?: Maybe<Scalars['Int']>
}

export interface CardImageArgs {
  language?: Maybe<Scalars['String']>
  type?: Maybe<ImageTypes>
  hostname?: Maybe<Scalars['String']>
}

export interface CardConnection {
  __typename?: 'CardConnection'
  edges?: Maybe<Array<Maybe<CardNode>>>
  pageInfo: PageInfo
}

export interface CardDeckItem {
  id: Scalars['String']
  importId?: Maybe<Scalars['String']>
  count: Scalars['Int']
}

export interface CardNode {
  __typename?: 'CardNode'
  node?: Maybe<Card>
}

export interface Comment {
  __typename?: 'Comment'
  id: Scalars['Int']
  createdAt: Scalars['Date']
  user: PublicUser
  comment: Scalars['String']
  children: CommentConnection
  score?: Maybe<Score>
}

export interface CommentConnection {
  __typename?: 'CommentConnection'
  edges?: Maybe<Array<Maybe<CommentNode>>>
  pageInfo: PageInfo
}

export interface CommentNode {
  __typename?: 'CommentNode'
  node?: Maybe<Comment>
}

export interface CreateAccountPayload {
  __typename?: 'CreateAccountPayload'
  url?: Maybe<Scalars['String']>
}

export interface CreateDeckResponse {
  __typename?: 'CreateDeckResponse'
  error?: Maybe<Scalars['String']>
  deck?: Maybe<Deck>
}

export interface CreatePayload {
  publishAt?: Maybe<Scalars['Date']>
  name: Scalars['String']
  cards: Scalars['JSON']
  folder: Scalars['String']
}

export interface CreateResponse {
  __typename?: 'CreateResponse'
  error?: Maybe<Scalars['String']>
  gameVersion?: Maybe<GameVersion>
}

export interface Deck {
  __typename?: 'Deck'
  id: Scalars['Int']
  createdAt: Scalars['Date']
  updatedAt: Scalars['Date']
  user: PublicUser
  visibility?: Maybe<Visibility>
  slug: Scalars['String']
  name: Scalars['String']
  guide?: Maybe<Scalars['String']>
  content: Array<Maybe<DeckContent>>
  curve?: Maybe<Array<Maybe<Scalars['Int']>>>
  stats?: Maybe<Array<Maybe<Stats>>>
  views?: Maybe<Scalars['Int']>
  featuredCard?: Maybe<Card>
  cards: CardConnection
  gameVersion: GameVersion
  mainNation: Nation
  allyNation: Nation
  score: Score
  thread?: Maybe<Thread>
  wildCards: Array<Maybe<Scalars['Int']>>
  /** @deprecated This feature is being replace with wildCards */
  resources?: Maybe<Scalars['Int']>
}

export interface DeckConnection {
  __typename?: 'DeckConnection'
  edges?: Maybe<Array<Maybe<DeckNode>>>
  pageInfo: PageInfo
}

export interface DeckContent {
  __typename?: 'DeckContent'
  language: Scalars['String']
  name: Scalars['String']
  guide?: Maybe<Scalars['JSON']>
}

export interface DeckInput {
  id?: Maybe<Scalars['Int']>
  visibility?: Maybe<Visibility>
  gameVersion?: Maybe<Scalars['Int']>
  mainNation?: Maybe<Scalars['Int']>
  allyNation?: Maybe<Scalars['Int']>
  content?: Maybe<Array<Maybe<LanguageContent>>>
  cards?: Maybe<Array<Maybe<CardDeckItem>>>
}

export interface DeckNode {
  __typename?: 'DeckNode'
  node: Deck
}

export enum DeckOrderType {
  Desc = 'desc',
  Asc = 'asc'
}

export enum DeckSortType {
  Week = 'week',
  Month = 'month',
  Updated = 'updated'
}

export interface DeckVersion {
  __typename?: 'DeckVersion'
  name: Scalars['String']
  guide?: Maybe<Scalars['String']>
}

export interface DeleteDeckResponse {
  __typename?: 'DeleteDeckResponse'
  error?: Maybe<Scalars['String']>
  value?: Maybe<Scalars['Int']>
}

export interface EditPayload {
  id: Scalars['Int']
  publishAt?: Maybe<Scalars['Date']>
  name: Scalars['String']
  folder: Scalars['String']
}

export interface FeaturedDecksResponse {
  __typename?: 'FeaturedDecksResponse'
  error?: Maybe<Scalars['String']>
  decks?: Maybe<DeckConnection>
}

export interface GameVersion {
  __typename?: 'GameVersion'
  id: Scalars['Int']
  name: Scalars['String']
  createdAt: Scalars['Date']
  updatedAt: Scalars['Date']
  deletedAt?: Maybe<Scalars['Date']>
  publishAt?: Maybe<Scalars['Date']>
  folder?: Maybe<Scalars['String']>
  cardUrl: Scalars['String']
  thumbUrl: Scalars['String']
  cards: CardConnection
}

export interface GameVersionConnection {
  __typename?: 'GameVersionConnection'
  edges?: Maybe<Array<Maybe<GameVersionNode>>>
}

export interface GameVersionNode {
  __typename?: 'GameVersionNode'
  node: GameVersion
}

export enum ImageTypes {
  Default = 'default',
  Thumb = 'thumb',
  Tiny = 'tiny'
}

export interface Language {
  __typename?: 'Language'
  id: Scalars['String']
  code: Scalars['String']
  name: Scalars['String']
}

export interface LanguageContent {
  language: Scalars['String']
  name?: Maybe<Scalars['String']>
  guide?: Maybe<Scalars['JSON']>
}

export interface Link {
  __typename?: 'Link'
  href: Scalars['String']
  as?: Maybe<Scalars['String']>
  target?: Maybe<Scalars['String']>
}

export interface Me {
  __typename?: 'Me'
  currentTime?: Maybe<Scalars['Date']>
  user?: Maybe<User>
}

export interface MyVote {
  __typename?: 'MyVote'
  id: Scalars['Int']
  commentId?: Maybe<Scalars['Int']>
  deckId?: Maybe<Scalars['Int']>
  value: Scalars['Int']
}

export interface Nation {
  __typename?: 'Nation'
  id: Scalars['Int']
  key: Scalars['Int']
  shortName: Scalars['String']
  name: Scalars['String']
  hq?: Maybe<Scalars['String']>
  hqImage?: Maybe<Scalars['String']>
  allyOnly: Scalars['Boolean']
}

export interface NationConnection {
  __typename?: 'NationConnection'
  edges?: Maybe<Array<Maybe<NationNode>>>
  pageInfo: PageInfo
}

export interface NationNode {
  __typename?: 'NationNode'
  node?: Maybe<Nation>
}

export interface PageInfo {
  __typename?: 'PageInfo'
  count: Scalars['Int']
  hasNextPage: Scalars['Boolean']
}

export interface PublicUser {
  __typename?: 'PublicUser'
  id: Scalars['Int']
  username?: Maybe<Scalars['String']>
  decks: DeckConnection
}

export interface PublicUserDecksArgs {
  language?: Maybe<Scalars['String']>
  first?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
}

export interface Range {
  min?: Maybe<Scalars['Int']>
  max?: Maybe<Scalars['Int']>
}

export interface Score {
  __typename?: 'Score'
  up: Scalars['Int']
  down: Scalars['Int']
  score: Scalars['Int']
}

export interface Set {
  __typename?: 'Set'
  name: Scalars['String']
}

export enum SocialLoginProvider {
  Google = 'google',
  Twitch = 'twitch',
  Discord = 'discord',
  Vk = 'vk',
  Facebook = 'facebook'
}

export interface Stats {
  __typename?: 'Stats'
  key?: Maybe<Scalars['String']>
  value?: Maybe<Scalars['String']>
}

export interface Thread {
  __typename?: 'Thread'
  id: Scalars['Int']
  comments: CommentConnection
  count: Scalars['Int']
}

export interface ThreadConnection {
  __typename?: 'ThreadConnection'
  edges?: Maybe<Array<Maybe<ThreadNode>>>
  pageInfo: PageInfo
}

export interface ThreadNode {
  __typename?: 'ThreadNode'
  node?: Maybe<Thread>
}

export enum TopDeckType {
  Week = 'week',
  Month = 'month'
}

export interface User {
  __typename?: 'User'
  id: Scalars['Int']
  email: Scalars['String']
  username?: Maybe<Scalars['String']>
  role?: Maybe<Scalars['String']>
  decks: DeckConnection
}

export interface UserDecksArgs {
  language?: Maybe<Scalars['String']>
  first?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
}

export interface UserConnection {
  __typename?: 'UserConnection'
  edges?: Maybe<Array<Maybe<UserNode>>>
  pageInfo: PageInfo
}

export interface UserInput {
  id: Scalars['Int']
  username?: Maybe<Scalars['String']>
  role?: Maybe<Scalars['String']>
}

export interface UserNode {
  __typename?: 'UserNode'
  node?: Maybe<User>
}

export interface UserPayload {
  __typename?: 'UserPayload'
  error?: Maybe<Scalars['String']>
  user?: Maybe<User>
}

export enum Visibility {
  Public = 'public',
  Unlisted = 'unlisted'
}

export interface Vote {
  __typename?: 'Vote'
  id: Scalars['Int']
  value: Scalars['Int']
}

export interface VotePayLoad {
  __typename?: 'VotePayLoad'
  error?: Maybe<Scalars['String']>
  vote?: Maybe<Vote>
  newScore?: Maybe<Score>
}
