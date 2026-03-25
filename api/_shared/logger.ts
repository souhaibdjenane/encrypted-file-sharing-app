export const logger = {
  info: (msg: string, details?: any) => console.log(`[INFO] ${msg}`, details || ''),
  error: (msg: string, details?: any) => console.error(`[ERROR] ${msg}`, details || ''),
  warn: (msg: string, details?: any) => console.warn(`[WARN] ${msg}`, details || ''),
}
