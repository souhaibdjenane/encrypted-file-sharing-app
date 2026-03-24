/**
 * Structured JSON logger for Edge Functions.
 */
export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    }))
  },

  warn(message: string, data?: Record<string, unknown>) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    }))
  },

  error(message: string, data?: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    }))
  },
}
