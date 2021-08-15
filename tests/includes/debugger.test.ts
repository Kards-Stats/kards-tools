import { Debugger } from '../../includes'

describe('getLevelFromName', () => {
  var logger: Debugger
  beforeEach(() => {
    logger = new Debugger()
  })
  it('Should have silly as lowest', () => {
    const sillyLevel = logger.getLevelFromName('silly')
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('debug'))
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('info'))
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('warn'))
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('error'))
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('fatal'))
    expect(sillyLevel).toBeGreaterThan(logger.getLevelFromName('invalid'))
  })
  it('Should ignore capitalisation', () => {
    const sillyLevel = logger.getLevelFromName('silly')
    expect(sillyLevel).toBe(logger.getLevelFromName('SiLLY'))
  })
  it('Should return default for invalid', () => {
    const sillyLevel = logger.getLevelFromName('invalid')
    expect(sillyLevel).not.toBe(-1)
  })
})

describe('fatal', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('fatal', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.fatal('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on fatal level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.fatal('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.fatal('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.fatal('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('error', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('error', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.error('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on error level', () => {
    logger.level = logger.getLevelFromName('error')
    logger.error('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.error('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on higher level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.error('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.error('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('warn', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('warn', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on warn level', () => {
    logger.level = logger.getLevelFromName('warn')
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on higher level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.warn('Message')
    logger.level = logger.getLevelFromName('error')
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(2)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('info', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('info', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.info('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on info level', () => {
    logger.level = logger.getLevelFromName('info')
    logger.info('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.info('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on higher level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.info('Message')
    logger.level = logger.getLevelFromName('error')
    logger.info('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.info('Message')
    expect(func.mock.calls.length).toBe(3)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.info('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('debug', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('debug', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on debug level', () => {
    logger.level = logger.getLevelFromName('debug')
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on higher level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('error')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('info')
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(4)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('silly', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('silly', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should call on default', () => {
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on silly level', () => {
    logger.level = logger.getLevelFromName('silly')
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on invalid level', () => {
    logger.level = logger.getLevelFromName('invalid')
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(1)
  })
  it('Should call on higher level', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('error')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('info')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('debug')
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(5)
  })
  it('Should call on negative level', () => {
    logger.level = -1
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(1)
  })
})

describe('all', () => {
  var logger: Debugger
  var func: jest.MockedFunction<any>
  beforeEach(() => {
    logger = new Debugger()
    func = jest.fn()
    logger.on('all', func)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Should not call on higher level silly', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('error')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('info')
    logger.silly('Message')
    logger.level = logger.getLevelFromName('debug')
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(0)
  })
  it('Should not call on higher level debug', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('error')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.debug('Message')
    logger.level = logger.getLevelFromName('info')
    logger.debug('Message')
    expect(func.mock.calls.length).toBe(0)
  })
  it('Should not call on higher level info', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.info('Message')
    logger.level = logger.getLevelFromName('error')
    logger.info('Message')
    logger.level = logger.getLevelFromName('warn')
    logger.info('Message')
    expect(func.mock.calls.length).toBe(0)
  })
  it('Should not call on higher level warn', () => {
    logger.level = logger.getLevelFromName('fatal')
    logger.warn('Message')
    logger.level = logger.getLevelFromName('error')
    logger.warn('Message')
    expect(func.mock.calls.length).toBe(0)
  })
  it('Should not call on higher level error', () => {
    logger.on('error', () => {})
    logger.level = logger.getLevelFromName('fatal')
    logger.error('Message')
    expect(func.mock.calls.length).toBe(0)
  })
  it('Should not call on negative level', () => {
    logger.on('error', () => {})
    logger.level = -1
    logger.fatal('Message')
    logger.error('Message')
    logger.warn('Message')
    logger.info('Message')
    logger.debug('Message')
    logger.silly('Message')
    expect(func.mock.calls.length).toBe(0)
  })
})
