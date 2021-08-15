import { logger } from '../../includes'

describe('getLogger', () => {
  beforeEach(() => {
    logger.resetLoggers()
  })
  it('Should throw on empty name', () => {
    expect(() => { logger.getLogger('a', '') }).toThrow()
  })
  it('Should throw on empty fork', () => {
    expect(() => { logger.getLogger('', 'b') }).toThrow()
  })
  it('Should throw on empty name and fork', () => {
    expect(() => { logger.getLogger('', '') }).toThrow()
  })
  it('Should create logger', () => {
    var allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('a - b')).not.toBeDefined()
    var loggerObj = logger.getLogger('a', 'b')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
  })
  it('Should use existing logger', () => {
    var allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('a - b')).not.toBeDefined()
    var loggerObj = logger.getLogger('a', 'b')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
    expect(allLoggers.size).toBe(1)
    loggerObj = logger.getLogger('a', 'b')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
    expect(allLoggers.size).toBe(1)
  })
})

describe('getCurrentLogger', () => {
  beforeEach(() => {
    logger.resetLoggers()
  })
  it('Should throw on empty name', () => {
    expect(() => { logger.getCurrentLogger('') }).toThrow()
  })
  it('Should create logger', () => {
    var allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('master - a')).not.toBeDefined()
    var loggerObj = logger.getCurrentLogger('a')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
  })
  it('Should use existing logger', () => {
    var allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('master - a')).not.toBeDefined()
    var loggerObj = logger.getCurrentLogger('a')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
    expect(allLoggers.size).toBe(1)
    loggerObj = logger.getCurrentLogger('a')
    expect(loggerObj).toBeDefined()
    allLoggers = logger.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
    expect(allLoggers.size).toBe(1)
  })
})

describe('getForkName', () => {
  beforeEach(() => {
    logger.resetLoggers()
  })
  it('Should return master', () => {
    const forkName = logger.getForkName(true, undefined, undefined)
    expect(forkName).toBe('master')
  })
  it('Should return master for blank name', () => {
    const forkName = logger.getForkName(true, '', undefined)
    expect(forkName).toBe('master')
  })
  it('Should return fork id for blank name', () => {
    const forkName = logger.getForkName(false, '', '1')
    expect(forkName).toBe('Fork 1')
  })
  it('Should return fork blank for blank name', () => {
    const forkName = logger.getForkName(false, '', undefined)
    expect(forkName).toBe('Fork')
  })
  it('Should return name', () => {
    const forkName = logger.getForkName(true, 'name', undefined)
    expect(forkName).toBe('name')
  })
  it('Should return fork id', () => {
    const forkName = logger.getForkName(false, undefined, '1')
    expect(forkName).toBe('Fork 1')
  })
  it('Should return fork blank', () => {
    const forkName = logger.getForkName(false, undefined, undefined)
    expect(forkName).toBe('Fork')
  })
  it('Should return fork blank with empty', () => {
    const forkName = logger.getForkName(false, undefined, '')
    expect(forkName).toBe('Fork')
  })
})

describe('Format Object', () => {
  beforeAll(() => {
    logger.resetLoggers()
  })
  it('Should format strings', () => {
    const info = logger.formatObject('yeet')
    expect(info).toBe('yeet')
  })
  it('Should format errors', () => {
    const info = logger.formatObject(new Error('yeetErr'))
    expect(info).toBe('yeetErr')
  })
  it('Should format objects', () => {
    const info = logger.formatObject({ value: 'yar' })
    expect(info).toBe('{"value":"yar"}')
  })
  it('Should format object message', () => {
    const info = logger.formatObject({ message: 'yar' })
    expect(info).toBe('yar')
  })
  it('Should format undefined', () => {
    const info = logger.formatObject(undefined)
    expect(info).toBe('undefined')
  })
  it('Should format null', () => {
    const info = logger.formatObject(null)
    expect(info).toBe('null')
  })
})
