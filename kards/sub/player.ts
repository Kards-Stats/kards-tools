import { Debugger } from '../../includes'
import Requester from '../request'
import {
  FriendListItem,
  FriendId
} from '../../types/kards-backend'

export default class Player {
  public logger: Debugger
  public request: Requester

  constructor (logger?: Debugger, request?: Requester) {
    this.logger = logger ?? new Debugger()
    this.request = request ?? new Requester()
  }

  private throwForSession (): void {
    if (this.request.session === undefined) {
      throw new Error('Must have session to access player resources')
    }
  }

  public async addFriendById (id: number): Promise<FriendId> {
    this.logger.silly(`addFriendById(${id})`)
    this.throwForSession()
    const friendId = await this.request.authenticatedPost(`/players/${await this.request.session?.getPlayerID() ?? ''}/friends`, JSON.stringify({
      friend_id: id
    }))
    if (typeof friendId !== 'object') {
      // throw new Error(friendId)
      throw new Error('Invalid type for friend id')
    }
    return friendId as FriendId
  }

  public async addFriendByName (name: string, tag: number): Promise<FriendId> {
    this.logger.silly(`addFriendByName(${name}, ${tag})`)
    this.throwForSession()
    const friendResult = await this.request.authenticatedPost(`/players/${await this.request.session?.getPlayerID() ?? ''}/friends`, JSON.stringify({
      friend_name: name,
      friend_tag: tag
    }))
    if (typeof friendResult !== 'object') {
      throw new Error('Invalid type for friend id')
    }
    return friendResult as FriendId
  }

  public async getPlayerName (id: number): Promise<string | undefined> {
    this.logger.silly(`getPlayerName(${id})`)
    var selfId = await this.request.session?.getPlayerID()
    if (selfId === id) {
      var selfName = await this.request.session?.getValue('player_name')
      var selfTag = await this.request.session?.getValue('player_tag')
      if (selfName !== undefined && selfTag !== undefined && selfName !== null && selfTag !== null) {
        if (typeof selfName === 'string' && typeof selfTag === 'number') {
          return `${selfName}#${selfTag}`
        }
      }
    }
    await this.addFriendById(id)
    var friends = await this.getFriends()
    for (const friend of friends) {
      if (friend.player_id === id) {
        return `${friend.player_name}#${friend.player_tag}`
      }
    }
    return undefined
  }

  public async getPlayerId (name: string, tag: number): Promise<number | undefined> {
    this.logger.silly(`getPlayerId(${name}, ${tag})`)
    try {
      var id = await this.addFriendByName(name, tag)
      return id.friend_id
    } catch (e) {
      if (e.status_code === 404) {
        return undefined
      }
      var selfName = await this.request.session?.getValue('player_name')
      var selfTag = await this.request.session?.getValue('player_tag')
      if (selfName === name && selfTag === tag) {
        return await this.request.session?.getPlayerID()
      }
      throw e
    }
  }

  public async getFriends (): Promise<FriendListItem[]> {
    this.logger.silly('getFriends()')
    this.throwForSession()
    const friends = await this.request.authenticatedGet(`/players/${await this.request.session?.getPlayerID() ?? ''}/friends?action=player-friends`)
    if (!Array.isArray(friends)) {
      throw new Error('Invalid type for friends data')
    }
    return friends as FriendListItem[]
  }
}
