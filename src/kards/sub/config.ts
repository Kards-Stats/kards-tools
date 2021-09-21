import Debugger from '../../includes/debugger'
import Requester from '../request'
import {
  Config as ConfigType
} from '../../../types/kards-backend'

export default class Config {
  protected config?: ConfigType
  public logger: Debugger
  public request: Requester

  constructor (logger?: Debugger, request?: Requester) {
    this.logger = logger ?? new Debugger()
    this.request = request ?? new Requester()
  }

  public async getConfig (): Promise<ConfigType> {
    this.logger.silly('getConfig()')
    const configData = await this.request.get('/config', false)
    if (typeof configData !== 'object') {
      /* istanbul ignore next */
      throw new Error(`Invalid type for home info, data: ${configData}`)
    }
    return configData as ConfigType
  }

  public async getCompatibleVersions (): Promise<string[]> {
    this.logger.silly('getCompatibleVersions()')
    if (this.config === undefined) {
      const configData = await this.getConfig()
      this.config = configData
    }
    return this.config.versions
  }

  public resetConfig (): void {
    this.logger.silly('resetConfig()')
    if (this.config !== undefined) {
      this.config = undefined
    }
  }
}
