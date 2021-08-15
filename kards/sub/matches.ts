import { Debugger } from '../../includes'
import Requester from '../request'
import {
  MatchStatus,
  Match
} from '../../types/kards-backend'

export default class Matches {
  public logger: Debugger
  public request: Requester

  constructor (logger?: Debugger, request?: Requester) {
    this.logger = logger ?? new Debugger()
    this.request = request ?? new Requester()
  }

  public async getMatchStatus (matchId: number): Promise<MatchStatus> {
    this.logger.silly('getMatchStatus()')
    if (matchId < 0) {
      throw new Error('Invalid match id provided')
    }
    try {
      const matchStatus = await this.request.authenticatedGet(`/matches/v2/${matchId}`)
      if (typeof matchStatus !== 'string') {
        /* istanbul ignore next */
        throw new Error('Invalid type for match status')
      }
      return matchStatus as MatchStatus
    } catch (e) {
      if (e.status_code === 404) {
        return 'not_found'
      } else {
        /* istanbul ignore next */
        throw e
      }
    }
  }

  public async getMatchData (matchId: number): Promise<Match> {
    this.logger.silly('getMatchData()')
    const matchData = await this.request.authenticatedGet(`/matches/v2/${matchId}/actions/1`)
    if (typeof matchData !== 'object') {
      /* istanbul ignore next */
      throw new Error(`Invalid type for match data, data: ${matchData}`)
    }
    return matchData as Match
  }
}
