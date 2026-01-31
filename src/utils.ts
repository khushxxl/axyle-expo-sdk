/**
 * Utility functions for the SDK
 */

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Safely stringify an object, handling circular references
 */
export function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Calculate size of an object in bytes
 */
export function getObjectSize(obj: any): number {
  return new Blob([safeStringify(obj)]).size;
}

/**
 * Validate event name
 */
export function isValidEventName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length === 0 || name.length > 255) return false;
  // Allow alphanumeric, spaces, underscores, hyphens
  return /^[a-zA-Z0-9\s_-]+$/.test(name);
}

/**
 * Sanitize event properties
 */
export function sanitizeProperties(
  properties: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip invalid keys
    if (!key || typeof key !== 'string' || key.length > 255) continue;
    
    // Only allow primitive types
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      sanitized[key] = value;
    } else if (typeof value === 'object') {
      // Convert objects/arrays to JSON strings
      try {
        sanitized[key] = safeStringify(value);
      } catch (e) {
        // Skip if can't stringify
      }
    }
  }
  
  return sanitized;
}

/**
 * Create a logger that respects debug mode
 */
export function createLogger(debug: boolean) {
  return {
    log: (...args: any[]) => {
      if (debug) console.log('[Axyle]', ...args);
    },
    warn: (...args: any[]) => {
      if (debug) console.warn('[Axyle]', ...args);
    },
    error: (...args: any[]) => {
      if (debug) console.error('[Axyle]', ...args);
    },
  };
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

