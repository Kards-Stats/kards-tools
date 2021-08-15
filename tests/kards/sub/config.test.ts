import { Config } from '../../../kards/sub'
import { Requester } from '../../../kards'
import { Debugger } from '../../../includes'

describe('Constructor', () => {
  var logger: Debugger
  var request: Requester
  beforeEach(async () => {
    logger = new Debugger()
    logger.level = logger.getLevelFromName('fatal')
    request = new Requester(logger)
  })
  it('Should create default with seperate loggers', async () => {
    var config = new Config()
    expect(config).toBeTruthy()
    expect(config.logger).toBeTruthy()
    expect(config.request).toBeTruthy()
    expect(config.logger.level).toBe(config.logger.getLevelFromName('warn'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('warn'))
    config.logger.level = config.logger.getLevelFromName('fatal')
    expect(config.logger.level).toBe(config.logger.getLevelFromName('fatal'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('warn'))
  })
  it('Should create default request with seperate loggers', async () => {
    var config = new Config(logger)
    expect(config).toBeTruthy()
    expect(config.logger).toBeTruthy()
    expect(config.request).toBeTruthy()
    expect(config.logger.level).toBe(config.logger.getLevelFromName('fatal'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('warn'))
    config.logger.level = config.logger.getLevelFromName('error')
    expect(config.logger.level).toBe(config.logger.getLevelFromName('error'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('warn'))
  })
  it('Should create default logger with seperate loggers', async () => {
    var config = new Config(undefined, request)
    expect(config).toBeTruthy()
    expect(config.logger).toBeTruthy()
    expect(config.request).toBeTruthy()
    expect(config.logger.level).toBe(config.logger.getLevelFromName('warn'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('fatal'))
    config.logger.level = config.logger.getLevelFromName('error')
    expect(config.logger.level).toBe(config.logger.getLevelFromName('error'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('fatal'))
  })
  it('Should create with values with same loggers', async () => {
    var config = new Config(logger, request)
    expect(config).toBeTruthy()
    expect(config.logger).toBeTruthy()
    expect(config.request).toBeTruthy()
    expect(config.logger.level).toBe(config.logger.getLevelFromName('fatal'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('fatal'))
    config.logger.level = config.logger.getLevelFromName('error')
    expect(config.logger.level).toBe(config.logger.getLevelFromName('error'))
    expect(config.request.logger.level).toBe(config.request.logger.getLevelFromName('error'))
  })
})

describe('getConfig', () => {
  it('Should get config', async () => {
    var config = new Config()
    var configData = await config.getConfig()
    expect(configData).toBeTruthy()
  })
  it('Should reject', async () => {
    var request = new Requester()
    if (request.session !== undefined) {
      request.session.hostname = 'https://doesntexist.ff'
    }
    request.hostnameDefault = 'https://doesntexist.ff'
    var config = new Config(undefined, request)
    await expect(config.getConfig()).rejects.toBeTruthy()
  })
})

describe('getCompatibleVersions', () => {
  it('Should get after request', async () => {
    var config = new Config()
    var versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
  })
  it('Should get instantly', async () => {
    var config = new Config()
    var versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
    versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
  })
  it('Should reject', async () => {
    var request = new Requester()
    if (request.session !== undefined) {
      request.session.hostname = 'https://doesntexist.ff'
    }
    request.hostnameDefault = 'https://doesntexist.ff'
    var config = new Config(undefined, request)
    await expect(config.getCompatibleVersions()).rejects.toBeTruthy()
  })
  it('Should resolve without backend', async () => {
    var config = new Config()
    var versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
    if (config.request.session !== undefined) {
      config.request.session.hostname = 'https://doesntexist.ff'
    }
    config.request.hostnameDefault = 'https://doesntexist.ff'
    versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
  })
})

describe('resetConfig', () => {
  it('Should do nothing', async () => {
    var config = new Config()
    expect(() => {
      config.resetConfig()
    }).not.toThrow()
  })
  it('Should reset config', async () => {
    var config = new Config()
    var versions = await config.getCompatibleVersions()
    expect(versions).toBeTruthy()
    expect(versions.length).toBeGreaterThan(0)
    if (config.request.session !== undefined) {
      config.request.session.hostname = 'https://doesntexist.ff'
    }
    config.request.hostnameDefault = 'https://doesntexist.ff'
    config.resetConfig()
    expect(config.getCompatibleVersions()).rejects.toBeTruthy()
  })
})
