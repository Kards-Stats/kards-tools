import { SteamUser } from '../../types/backend'

export interface SteamAccountConnector {
  addSteamUser: (username: string, password: string, type: string) => Promise<SteamUser | null>
  getUnbanned: (type: string) => Promise<Array<SteamUser | null>>
  getUser: (username: string) => Promise<SteamUser | null>
  getOldest: (type: string) => Promise<SteamUser | null>
  addSteamLogin: (username: string, steamId: string, ticket: string) => Promise<SteamUser | null>
  addKardsLogin: (username: string) => Promise<SteamUser | null>
  setBanned: (username: string, banned: boolean) => Promise<SteamUser | null>
  saveFile: (filename: string, contents: Buffer) => Promise<void>
  readFile: (filename: string) => Promise<Buffer | null>
}
