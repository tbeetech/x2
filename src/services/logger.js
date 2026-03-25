/**
 * Client-side logger service
 * Provides structured logging with different levels and prevents console pollution in production
 */

const isDevelopment = import.meta.env.DEV;

class Logger {
  constructor() {
    this.enabled = isDevelopment;
  }

  /**
   * Log informational messages
   * @param {string} message - Message to log
   * @param {object} context - Additional context
   */
  info(message, context = {}) {
    if (!this.enabled) return;
    
    if (Object.keys(context).length > 0) {
      console.log(`[INFO] ${message}`, context);
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {object} context - Additional context
   */
  warn(message, context = {}) {
    if (!this.enabled) return;
    
    if (Object.keys(context).length > 0) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log error messages (always logged even in production)
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or context
   */
  error(message, error = null) {
    // Always log errors, even in production
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else if (error) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log debug messages (only in development)
   * @param {string} message - Debug message
   * @param {object} context - Additional context
   */
  debug(message, context = {}) {
    if (!this.enabled) return;
    
    if (Object.keys(context).length > 0) {
      console.log(`[DEBUG] ${message}`, context);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

export const logger = new Logger();
export default logger;
