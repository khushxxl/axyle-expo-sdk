/**
 * Constants used throughout the SDK
 */

export const STORAGE_PREFIX = "@axyle";

export const STORAGE_KEYS = {
  EVENTS_QUEUE: `${STORAGE_PREFIX}/events-queue`,
  ANONYMOUS_ID: `${STORAGE_PREFIX}/anonymous-id`,
  USER_ID: `${STORAGE_PREFIX}/user-id`,
  SESSION_DATA: `${STORAGE_PREFIX}/session-data`,
  OPT_OUT: `${STORAGE_PREFIX}/opt-out`,
};

// Production server URL - not configurable by users
export const PRODUCTION_BASE_URL =
  "https://axyle-server-production.up.railway.app";

export const DEFAULT_CONFIG = {
  baseUrl: PRODUCTION_BASE_URL,
  debug: false,
  maxQueueSize: 100,
  flushInterval: 10000, // 10 seconds
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  environment: "prod" as const,
};

export const SCHEMA_VERSION = "1.0.0";

export const MAX_EVENT_SIZE = 32 * 1024; // 32KB per event
export const MAX_BATCH_SIZE = 500 * 1024; // 500KB per batch
export const MAX_EVENTS_PER_BATCH = 100;

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 32000, // 32 seconds
  backoffMultiplier: 2,
};

export const AUTO_TRACKED_EVENTS = {
  APP_OPENED: "App Opened",
  APP_BACKGROUNDED: "App Backgrounded",
  APP_FOREGROUNDED: "App Foregrounded",
  SESSION_STARTED: "Session Started",
  SESSION_ENDED: "Session Ended",
  SCREEN_VIEWED: "Screen Viewed",
};
