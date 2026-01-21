/**
 * Simple logger utility
 * In production, use Winston or similar
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string, meta?: any): void {
    console.log(`[INFO] [${this.context}] ${message}`, meta || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] [${this.context}] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] [${this.context}] ${message}`, meta || '');
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error);
  }
}
