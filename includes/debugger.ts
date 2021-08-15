import { EventEmitter } from 'events'

export default class Debugger extends EventEmitter {
  public level: number
  public levels: string[]

  constructor () {
    super()
    this.levels = [
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'silly'
    ]
    this.level = this.getLevelFromName('warn')
  }

  private isLevel (level: string): boolean {
    return this.getLevelFromName(level) <= this.level
  }

  public getLevelFromName (name: string): number {
    const calculated = this.levels.indexOf(name.toLowerCase())
    return calculated !== -1 ? calculated : 2
  }

  public writeDebug (level: string, ...data: any[]): void {
    this.emit(level, data)
    if (this.isLevel(level)) {
      data.push(level)
      this.emit('all', data)
    }
  }

  public fatal (...data: any[]): void {
    this.writeDebug('fatal', data)
  }

  public error (...data: any[]): void {
    this.writeDebug('error', data)
  }

  public warn (...data: any[]): void {
    this.writeDebug('warn', data)
  }

  public info (...data: any[]): void {
    this.writeDebug('info', data)
  }

  public debug (...data: any[]): void {
    this.writeDebug('debug', data)
  }

  public silly (...data: any[]): void {
    this.writeDebug('silly', data)
  }
}
