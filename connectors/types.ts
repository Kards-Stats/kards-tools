import { SteamUser } from '../types/backend'

export interface SteamAccountConnector {
  getUnbanned: (type: string) => Promise<SteamUser[] | null>
  getUser: (username: string) => Promise<SteamUser | null>
  getOldest: (type: string) => Promise<SteamUser | null>
  addSteamLogin: (username: string, steamId: string, ticket: string) => Promise<SteamUser | null>
  addKardsLogin: (username: string) => Promise<SteamUser | null>
  setBanned: (username: string, banned: boolean) => Promise<SteamUser | null>
}
