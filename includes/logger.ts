import * as logger from 'winston'
import 'winston-daily-rotate-file'
import { isMaster } from 'cluster'

var loggers: Map<string, logger.Logger> = new Map()

export function formatObject (param: any): string {
  if (param === undefined) {
    return 'undefined'
  }
  if (param === null) {
    return 'null'
  }
  if (typeof param === 'object') {
    if (Object.prototype.hasOwnProperty.call(param, 'message')) {
      return param.message
    }
    var cache: any[] | null = []
    var result = JSON.stringify(param, (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache?.includes(value) ?? false) return
        cache?.push(value)
      }
      return value
    })
    cache = null
    return result
  }
  return param.toString()
}

/* istanbul ignore start */
const all = logger.format((info: any) => {
  const message: any = info.message
  if (info.data !== undefined) {
    /* istanbul ignore next 2 */
    info.message = `${formatObject(message)} ${JSON.stringify(info.data)}`
    delete info.data
  } else {
    info.message = `${formatObject(message)}`
  }
  return info
})
/* istanbul ignore stop */

interface CustomTransformableInfo extends logger.Logform.TransformableInfo {
  timestamp: string
  label: string
}

const levels = [
  'error',
  'warn',
  'info',
  'debug',
  'silly'
]

export function resetLoggers (): void {
  for (var logger of loggers.values()) {
    logger.close()
  }
  loggers = new Map<string, logger.Logger>()
}

export function getAllLoggers (): Map<string, logger.Logger> {
  return loggers
}

export function getConfig (label: string): logger.LoggerOptions {
  var consoleLevel = process.env.console_level ?? process.env.log_level ?? ''
  if (!levels.includes(consoleLevel)) {
    consoleLevel = process.env.log_level ?? ''
    if (!levels.includes(consoleLevel)) {
      consoleLevel = 'error'
    }
  }
  var logLevel = process.env.log_level ?? ''
  if (!levels.includes(logLevel)) {
    logLevel = 'info'
  }
  var levelsObj: logger.config.AbstractConfigSetLevels = {}
  for (var i = 0; i < levels.length; i++) {
    levelsObj[levels[i]] = i + 1
  }
  return {
    levels: levelsObj,
    format: logger.format.combine(
      logger.format.errors({ stack: true }),
      logger.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
      logger.format.label({ label: label }),
      all(),
      logger.format.json()
    ),
    transports: [
      new logger.transports.Console({
        level: consoleLevel,
        format: logger.format.combine(
          logger.format.colorize(),
          logger.format.printf((msg) => {
            /* istanbul ignore next 2 */
            const msgTyped: CustomTransformableInfo = msg as CustomTransformableInfo
            return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`
          })
        )
      }),
      new logger.transports.DailyRotateFile({
        level: logLevel,
        filename: [process.cwd(), 'logs/console.rotating.log'].join('/'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logger.format.combine(
          logger.format.printf((msg) => {
            /* istanbul ignore next 2 */
            const msgTyped: CustomTransformableInfo = msg as CustomTransformableInfo
            return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`
          })
        )
      })
    ]
  }
}

export function getLogger (fork: string, name: string): logger.Logger {
  if (fork === '' || name === '') {
    throw new Error('Get logger fork or name is empty')
  }
  const builtName = `${fork} - ${name}`
  if (loggers.has(builtName)) {
    const result = loggers.get(builtName)
    if (result !== undefined) {
      return result
    }
  }
  const result = logger.createLogger(getConfig(builtName))
  loggers.set(builtName, result)
  return result
}

export function getCurrentLogger (name: string): logger.Logger {
  if (name === '') {
    throw new Error('Current logger name is empty')
  }
  const logger = getLogger(getForkName(isMaster, process.env.name, process.env.FORK_ID), name)
  return logger
}

export function getForkName (isMaster: boolean, name: string | undefined, forkId: string | undefined): string {
  if (name === undefined || name === '') {
    if (isMaster) {
      return 'master'
    }
    return `Fork ${forkId ?? ''}`.trim()
  }
  return name
}
