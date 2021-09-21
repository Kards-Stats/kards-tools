import Debugger from '../includes/debugger'
import Session from './session'
import Requester from './request'
import Home from './sub/home'
import Matches from './sub/matches'
import Player from './sub/player'
import Config from './sub/config'

export default class KardsApi {
  public logger: Debugger
  public request: Requester
  public home: Home
  public matches: Matches
  public player: Player
  public config: Config

  constructor (session?: Session, logger?: Debugger) {
    this.logger = logger ?? new Debugger()
    this.request = new Requester(this.logger, session)
    this.home = new Home(this.logger, this.request)
    this.config = new Config(this.logger, this.request)
    this.matches = new Matches(this.logger, this.request)
    this.player = new Player(this.logger, this.request)
  }

  public setSession (session?: Session): void {
    this.request.session = session
  }
}
