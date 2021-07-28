import winston from 'winston'
import * as loggerImport from '../../includes/logger'

describe('getLogger', () => {
  beforeEach(() => {
    loggerImport.resetLoggers()
  })
  it('Should throw on empty name', () => {
    expect(() => { loggerImport.getLogger('a', '') }).toThrow()
  })
  it('Should throw on empty fork', () => {
    expect(() => { loggerImport.getLogger('', 'b') }).toThrow()
  })
  it('Should throw on empty name and fork', () => {
    expect(() => { loggerImport.getLogger('', '') }).toThrow()
  })
  it('Should create logger', () => {
    var allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('a - b')).not.toBeDefined()
    var logger: winston.Logger = loggerImport.getLogger('a', 'b')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
  })
  it('Should use existing logger', () => {
    var allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('a - b')).not.toBeDefined()
    var logger: winston.Logger = loggerImport.getLogger('a', 'b')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
    expect(allLoggers.size).toBe(1)
    logger = loggerImport.getLogger('a', 'b')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('a - b')).toBeDefined()
    expect(allLoggers.size).toBe(1)
  })
})

describe('getCurrentLogger', () => {
  beforeEach(() => {
    loggerImport.resetLoggers()
  })
  it('Should throw on empty name', () => {
    expect(() => { loggerImport.getCurrentLogger('') }).toThrow()
  })
  it('Should create logger', () => {
    var allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('master - a')).not.toBeDefined()
    var logger: winston.Logger = loggerImport.getCurrentLogger('a')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
  })
  it('Should use existing logger', () => {
    var allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('master - a')).not.toBeDefined()
    var logger: winston.Logger = loggerImport.getCurrentLogger('a')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
    expect(allLoggers.size).toBe(1)
    logger = loggerImport.getCurrentLogger('a')
    expect(logger).toBeDefined()
    allLoggers = loggerImport.getAllLoggers()
    expect(allLoggers.get('master - a')).toBeDefined()
    expect(allLoggers.size).toBe(1)
  })
})

describe('getForkName', () => {
  beforeEach(() => {
    loggerImport.resetLoggers()
  })
  it('Should return master', () => {
    const forkName = loggerImport.getForkName(true, undefined, undefined)
    expect(forkName).toBe('master')
  })
  it('Should return master for blank name', () => {
    const forkName = loggerImport.getForkName(true, '', undefined)
    expect(forkName).toBe('master')
  })
  it('Should return fork id for blank name', () => {
    const forkName = loggerImport.getForkName(false, '', '1')
    expect(forkName).toBe('Fork 1')
  })
  it('Should return fork blank for blank name', () => {
    const forkName = loggerImport.getForkName(false, '', undefined)
    expect(forkName).toBe('Fork')
  })
  it('Should return name', () => {
    const forkName = loggerImport.getForkName(true, 'name', undefined)
    expect(forkName).toBe('name')
  })
  it('Should return fork id', () => {
    const forkName = loggerImport.getForkName(false, undefined, '1')
    expect(forkName).toBe('Fork 1')
  })
  it('Should return fork blank', () => {
    const forkName = loggerImport.getForkName(false, undefined, undefined)
    expect(forkName).toBe('Fork')
  })
  it('Should return fork blank with empty', () => {
    const forkName = loggerImport.getForkName(false, undefined, '')
    expect(forkName).toBe('Fork')
  })
})

describe('Format Object', () => {
  beforeAll(() => {
    loggerImport.resetLoggers()
  })
  it('Should format strings', () => {
    const info = loggerImport.formatObject('yeet')
    expect(info).toBe('yeet')
  })
  it('Should format errors', () => {
    const info = loggerImport.formatObject(new Error('yeetErr'))
    expect(info).toBe('yeetErr')
  })
  it('Should format objects', () => {
    const info = loggerImport.formatObject({ value: 'yar' })
    expect(info).toBe('{"value":"yar"}')
  })
  it('Should format object message', () => {
    const info = loggerImport.formatObject({ message: 'yar' })
    expect(info).toBe('yar')
  })
  it('Should format undefined', () => {
    const info = loggerImport.formatObject(undefined)
    expect(info).toBe('undefined')
  })
  it('Should format null', () => {
    const info = loggerImport.formatObject(null)
    expect(info).toBe('null')
  })
})
