/**
 * Core type definitions for Axyle Analytics SDK
 */

/**
 * SDK initialization accepts only the API key
 * All other settings use internal defaults
 */
export type AxyleInitConfig = string | { apiKey: string };

/**
 * Internal configuration type with all settings
 * Only apiKey comes from user, everything else uses defaults
 */
export interface InternalAxyleConfig {
  apiKey: string;
  userId: string;
  environment: "dev" | "prod";
  debug: boolean;
  maxQueueSize: number;
  flushInterval: number;
  sessionTimeout: number;
  baseUrl: string; // Always set to production URL, not configurable
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserTraits {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEvent {
  /** Unique event ID */
  id: string;
  /** Event name */
  name: string;
  /** Event properties */
  properties: EventProperties;
  /** Timestamp when event occurred */
  timestamp: number;
  /** User ID (anonymous or identified) */
  userId: string;
  /** Anonymous user ID (persists across sessions) */
  anonymousId: string;
  /** Session ID */
  sessionId: string;
  /** Device metadata */
  context: EventContext;
  /** Schema version */
  schemaVersion: string;
}

export interface EventContext {
  /** App information */
  app: {
    name: string;
    version: string;
    build: string;
    namespace: string;
  };
  /** Device information */
  device: {
    id: string | null;
    manufacturer: string | null;
    model: string | null;
    name: string | null;
    type: "PHONE" | "TABLET" | "DESKTOP" | "TV" | "UNKNOWN";
    brand: string | null;
  };
  /** OS information */
  os: {
    name: string;
    version: string;
  };
  /** Screen information */
  screen: {
    width: number;
    height: number;
    density: number;
  };
  /** Locale */
  locale: string;
  /** Timezone */
  timezone: string;
  /** Network information (if available) */
  network?: {
    carrier: string | null;
    wifi: boolean;
  };
  /** Environment */
  environment: "dev" | "prod";
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivityTime: number;
}

export interface StorageKeys {
  EVENTS_QUEUE: string;
  ANONYMOUS_ID: string;
  USER_ID: string;
  SESSION_DATA: string;
  OPT_OUT: string;
}
