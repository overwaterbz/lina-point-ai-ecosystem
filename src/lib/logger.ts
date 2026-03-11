/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 * Respects production vs development environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const LOG_PREFIX = '[LINA-POINT]';

/**
 * Format log message with timestamp
 */
const formatLogMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} - ${message}`;
};

/**
 * Debug logging - only in development
 */
export const logDebug = (message: string, data?: unknown): void => {
  if (isDevelopment) {
    console.log(formatLogMessage('debug', message), data || '');
  }
};

/**
 * Info logging - both development and production
 */
export const logInfo = (message: string, data?: unknown): void => {
  if (isDevelopment) {
    console.log(formatLogMessage('info', message), data || '');
  }
  // In production, could send to external logging service
};

/**
 * Warning logging - both environments
 */
export const logWarn = (message: string, data?: unknown): void => {
  console.warn(formatLogMessage('warn', message), data || '');
};

/**
 * Error logging - both environments
 */
export const logError = (message: string, error?: unknown): void => {
  const errorData = error instanceof Error ? error.message : String(error);
  console.error(formatLogMessage('error', message), errorData);
};

/**
 * Log API request (development only)
 */
export const logAPIRequest = (method: string, route: string, data?: unknown): void => {
  if (isDevelopment) {
    logDebug(`API ${method} ${route}`, data);
  }
};

/**
 * Log API response (development only)
 */
export const logAPIResponse = (route: string, status: number, data?: unknown): void => {
  if (isDevelopment) {
    logDebug(`API Response ${route} (${status})`, data);
  }
};

/**
 * Log agent execution
 */
export const logAgentExecution = (agentName: string, status: 'start' | 'complete' | 'error', data?: unknown): void => {
  const message = `Agent [${agentName}] - ${status.toUpperCase()}`;
  if (isDevelopment) {
    logDebug(message, data);
  }
};
