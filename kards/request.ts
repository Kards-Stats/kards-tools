import * as origHttps from 'https'
import { https } from 'follow-redirects'
import Q from 'q'
import Session from './session'
import KardsApiError from './kards-api-error'
import { Keyable } from '../types/backend'
import { OutgoingHttpHeaders } from 'http'
import { DRIFT_API_KEY, HOSTNAME } from './defaults'
import { Debugger } from '../includes'

export default class Requester {
  public logger: Debugger
  public session?: Session
  public driftApiKeyDefault?: string
  public hostnameDefault?: string

  constructor (logger?: Debugger, session?: Session) {
    this.logger = logger ?? new Debugger()
    this.session = session
  }

  get driftApiKey (): string {
    return this.session?.driftApiKey ?? this.driftApiKeyDefault ?? DRIFT_API_KEY
  }

  get hostname (): string {
    return this.session?.hostname ?? this.hostnameDefault ?? HOSTNAME
  }

  private async getJti (): Promise<string> {
    if (this.session === undefined) { throw new Error('KardsRequest needs a session before it can make authenticated requests') }
    return await this.session.getJti()
  }

  static getPath (endpoint: string, logger?: Debugger, hostname = HOSTNAME): string {
    logger?.silly('getPath')
    if (endpoint.startsWith('https://')) { endpoint = endpoint.split('https://')[1] }
    if (endpoint.startsWith(hostname)) { endpoint = endpoint.split(hostname)[1] }
    return endpoint
  }

  static async rawRequest (method: string, path: string, headers?: OutgoingHttpHeaders, data?: string, logger?: Debugger, hostname = HOSTNAME, driftApiKey = DRIFT_API_KEY): Promise<Keyable[] | Keyable | string> {
    logger?.silly('kardsRequest')
    const deferred = Q.defer()
    if (headers === undefined) {
      headers = {}
    }
    if (data !== undefined) {
      headers['Content-Length'] = data.length
      headers['Content-Type'] = 'application/json'
    } else {
      if (['PUT', 'POST', 'DELETE'].includes(method.toUpperCase())) {
        headers['Content-Length'] = 0
      }
    }
    headers['Drift-Api-Key'] = driftApiKey
    var options: origHttps.RequestOptions = {
      host: hostname,
      path: path,
      port: 443,
      method: method,
      headers: headers,
      rejectUnauthorized: false
    }
    const request = https.request(options, (res) => {
      var body = ''
      res.on('data', (d: string) => {
        body += d
      })
      res.on('end', () => {
        logger?.silly('request end')
        try {
          var json = JSON.parse(body)
          if (KardsApiError.isKardsError(json)) {
            logger?.silly('isKardsError')
            return deferred.reject(new KardsApiError(json))
          } else {
            logger?.silly('isJsonResult')
            return deferred.resolve(json)
          }
        } catch {
          logger?.silly('isTextResult')
          return deferred.resolve(body)
        }
      })
    })
    request.on('error', (e) => {
      logger?.silly('request error')
      return deferred.reject(e)
    })
    if (data !== undefined) {
      request.write(data)
    }
    request.end()
    return await (deferred.promise as any as Promise<Keyable | string>)
  }

  public async request (method: string, path: string, authenticated: boolean = false, data?: string): Promise<Keyable | string> {
    this.logger.silly('request')
    var headers: OutgoingHttpHeaders = {}
    if (authenticated) {
      const jti = await this.getJti()
      headers.Authorization = `jti ${jti}`
    }
    return await Requester.rawRequest(method.toUpperCase(), path, headers, data, this.logger, this.hostname, this.driftApiKey)
  }

  public async authenticatedGet (path: string): Promise<Keyable | string> {
    this.logger.silly('authenticatedGet')
    return await this.request('GET', path, true)
  }

  public async authenticatedPut (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('authenticatedPut')
    return await this.request('PUT', path, true, data)
  }

  public async authenticatedDelete (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('authenticatedDelete')
    return await this.request('DELETE', path, true, data)
  }

  public async authenticatedPost (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('authenticatedPost')
    return await this.request('POST', path, true, data)
  }

  public async publicGet (path: string): Promise<Keyable | string> {
    this.logger.silly('publicGet')
    return await this.request('GET', path, false)
  }

  public async publicPut (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('publicPut')
    return await this.request('PUT', path, false, data)
  }

  public async publicDelete (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('publicDelete')
    return await this.request('DELETE', path, false, data)
  }

  public async publicPost (path: string, data?: string): Promise<Keyable | string> {
    this.logger.silly('publicPost')
    return await this.request('POST', path, false, data)
  }

  public async get (path: string, authenticated: boolean = false): Promise<Keyable | string> {
    this.logger.silly('get')
    return await this.request('GET', path, authenticated)
  }

  public async put (path: string, authenticated: boolean = false, data?: string): Promise<Keyable | string> {
    this.logger.silly('put')
    return await this.request('PUT', path, authenticated, data)
  }

  public async delete (path: string, authenticated: boolean = false, data?: string): Promise<Keyable | string> {
    this.logger.silly('delete')
    return await this.request('DELETE', path, authenticated, data)
  }

  public async post (path: string, authenticated: boolean = false, data?: string): Promise<Keyable | string> {
    this.logger.silly('post')
    return await this.request('POST', path, authenticated, data)
  }
}
