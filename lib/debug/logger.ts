// lib/debug/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMessage {
  level: LogLevel
  message: string
  details?: any
  timestamp: string
  component?: string
}

class DebugLogger {
  private logs: LogMessage[] = []
  private isDebug = process.env.NODE_ENV !== 'production'

  constructor() {
    if (typeof window !== 'undefined') {
      // Expose logs to window for easy console access
      (window as any).__DEBUG_LOGS__ = this.logs
    }
  }

  private log(level: LogLevel, message: string, details?: any, component?: string) {
    const logMessage = {
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
      component
    }

    this.logs.push(logMessage)

    if (this.isDebug) {
      const logFn = console[level] || console.log
      const componentPrefix = component ? `[${component}] ` : ''
      logFn(`${componentPrefix}${message}`, details || '')
      
      // Display in UI if debug element exists
      this.updateDebugUI(logMessage)
    }
  }

  private updateDebugUI(logMessage: LogMessage) {
    if (typeof document === 'undefined') return

    const debugElement = document.getElementById('debug-overlay')
    if (debugElement) {
      const logElement = document.createElement('div')
      logElement.className = `debug-log debug-${logMessage.level}`
      logElement.innerHTML = `
        <span class="debug-timestamp">${new Date(logMessage.timestamp).toLocaleTimeString()}</span>
        <span class="debug-component">${logMessage.component || 'App'}</span>
        <span class="debug-message">${logMessage.message}</span>
      `
      debugElement.appendChild(logElement)
      
      // Keep only last 50 messages
      if (debugElement.children.length > 50) {
        debugElement.removeChild(debugElement.children[0])
      }
    }
  }

  debug(message: string, details?: any, component?: string) {
    this.log('debug', message, details, component)
  }

  info(message: string, details?: any, component?: string) {
    this.log('info', message, details, component)
  }

  warn(message: string, details?: any, component?: string) {
    this.log('warn', message, details, component)
  }

  error(message: string, details?: any, component?: string) {
    this.log('error', message, details, component)
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    if (typeof document !== 'undefined') {
      const debugElement = document.getElementById('debug-overlay')
      if (debugElement) {
        debugElement.innerHTML = ''
      }
    }
  }
}

export const logger = new DebugLogger()