import Debugger from '../../includes/debugger'
import Requester from '../request'
import {
  Home as HomeType,
  Endpoints
} from '../../../types/kards-backend'

export default class Home {
  protected endpoints?: Endpoints
  protected currentId?: number
  public logger: Debugger
  public request: Requester

  constructor (logger?: Debugger, request?: Requester) {
    this.logger = logger ?? new Debugger()
    this.request = request ?? new Requester()
  }

  static async getSessionEndpoint (logger?: Debugger, request?: Requester): Promise<string> {
    const home = new Home(logger, request)
    return await home.getSessionEndpoint()
  }

  public async getInfo (authenticated: boolean = false): Promise<HomeType> {
    this.logger.silly(`getInfo(${authenticated ? 'true' : 'false'})`)
    const homeData = await this.request.get('/', authenticated)
    if (typeof homeData !== 'object') {
      /* istanbul ignore next */
      throw new Error(`Invalid type for home info, data: ${homeData}`)
    }
    return homeData as HomeType
  }

  public async getSessionEndpoint (): Promise<string> {
    const endpoint = await this.getEndpoint('session')
    if (endpoint === undefined) {
      /* istanbul ignore next */
      throw new Error('Cannot find session endpoint')
    }
    return endpoint
  }

  public async getEndpoint (name: keyof Endpoints): Promise<string | undefined> {
    this.logger.silly(`getEndpoint(${name})`)
    var authenticated = false
    if (name.toLowerCase().startsWith('my_')) {
      authenticated = true
    }
    if (this.endpoints === undefined) {
      const homeData = await this.getInfo(authenticated)
      this.endpoints = homeData.endpoints
      this.currentId = homeData.current_user?.player_id
    } else {
      if ((this.endpoints[name] === undefined || this.endpoints[name] === null) && authenticated) {
        const homeData = await this.getInfo(authenticated)
        this.endpoints = homeData.endpoints
        this.currentId = homeData.current_user?.player_id
      }
    }
    return this.endpoints[name] === null ? undefined : this.endpoints[name]
  }

  public resetEndpoints (all: boolean = false): boolean {
    this.logger.silly(`resetEndpoints(${all ? 'true' : 'false'})`)
    if (this.endpoints !== undefined) {
      var changed: boolean = false
      if (this.currentId !== undefined) {
        this.currentId = undefined
        changed = true
      }
      if (all) {
        this.endpoints = undefined
        return true
      }
      if (this.endpoints.my_client !== undefined ||
        this.endpoints.my_draft !== undefined ||
        this.endpoints.my_items !== undefined ||
        this.endpoints.my_player !== undefined ||
        this.endpoints.my_user !== undefined) {
        this.endpoints.my_client = undefined
        this.endpoints.my_draft = undefined
        this.endpoints.my_items = undefined
        this.endpoints.my_player = undefined
        this.endpoints.my_user = undefined
        changed = true
      }
      return changed
    }
    return false
  }

  public async resetIfNew (all: boolean = false): Promise<boolean> {
    if (all) {
      return this.resetEndpoints(all)
    }
    if (this.request.session !== undefined) {
      var currentId = await this.request.session.getPlayerID()
      if (currentId !== this.currentId) {
        return this.resetEndpoints(all)
      }
    } else {
      return this.resetEndpoints(all)
    }
    return false
  }
}
