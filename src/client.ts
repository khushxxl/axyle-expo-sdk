/**
 * Main Axyle client
 * Public API surface for the SDK
 */

import { AppState, AppStateStatus } from "react-native";
import {
  AUTO_TRACKED_EVENTS,
  DEFAULT_CONFIG,
  MAX_EVENT_SIZE,
  SCHEMA_VERSION,
} from "./constants";
import { ContextCollector } from "./context";
import { EventQueue } from "./queue";
import { SessionManager } from "./session";
import { SessionAnalytics, SessionAnalyticsStats } from "./sessionAnalytics";
import { Storage } from "./storage";
import { Transport } from "./transport";
import {
  AnalyticsEvent,
  AxyleInitConfig,
  EventProperties,
  InternalAxyleConfig,
  UserTraits,
} from "./types";
import {
  createLogger,
  generateUUID,
  getObjectSize,
  isValidEventName,
  sanitizeProperties,
} from "./utils";

export class AxyleClient {
  private config: InternalAxyleConfig;
  private logger: any;
  private sessionManager: SessionManager;
  private sessionAnalytics: SessionAnalytics | null = null;
  private transport: Transport | null = null;
  private queue: EventQueue | null = null;
  private anonymousId: string = "";
  private userId: string | null = null;
  private _isInitialized = false;
  private isOptedOut = false;
  private appStateSubscription: any = null;

  /**
   * Check if SDK is initialized (public getter)
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  constructor() {
    // Initialize with defaults, will be overridden in init()
    this.config = {
      apiKey: "",
      environment: DEFAULT_CONFIG.environment,
      baseUrl: DEFAULT_CONFIG.baseUrl,
      debug: DEFAULT_CONFIG.debug,
      maxQueueSize: DEFAULT_CONFIG.maxQueueSize,
      flushInterval: DEFAULT_CONFIG.flushInterval,
      sessionTimeout: DEFAULT_CONFIG.sessionTimeout,
      userId: "",
    };

    this.logger = createLogger(this.config.debug);
    this.sessionManager = new SessionManager(
      this.config.sessionTimeout,
      this.logger,
      {
        onSessionStart: (sessionId) => this.handleSessionStart(sessionId),
        onSessionEnd: (sessionId, duration) =>
          this.handleSessionEnd(sessionId, duration),
      }
    );
  }

  /**
   * Initialize the SDK
   * Only accepts API key - all other settings use defaults
   */
  async init(config: AxyleInitConfig): Promise<void> {
    try {
      // Extract API key from string or object
      const apiKey = typeof config === "string" ? config : config.apiKey;

      if (!apiKey) {
        this.logger.warn("API key is required for SDK initialization");
      }

      // Use defaults for all settings - only API key is configurable
      this.config = {
        apiKey: apiKey || "",
        userId: "",
        environment: DEFAULT_CONFIG.environment,
        debug: DEFAULT_CONFIG.debug,
        maxQueueSize: DEFAULT_CONFIG.maxQueueSize,
        flushInterval: DEFAULT_CONFIG.flushInterval,
        sessionTimeout: DEFAULT_CONFIG.sessionTimeout,
        baseUrl: DEFAULT_CONFIG.baseUrl, // Always use production URL
      };

      // Update logger
      this.logger = createLogger(this.config.debug);

      // Check opt-out status
      this.isOptedOut = await Storage.isOptedOut();
      if (this.isOptedOut) {
        this.logger.log("User has opted out, analytics disabled");
        this._isInitialized = true; // Set initialized even if opted out
        return;
      }

      // Load anonymous ID
      this.anonymousId = await Storage.getAnonymousId();

      // Load user ID from storage (not configurable at init)
      this.userId = await Storage.getUserId();

      // Initialize session manager
      this.sessionManager = new SessionManager(
        this.config.sessionTimeout,
        this.logger,
        {
          onSessionStart: (sessionId) => this.handleSessionStart(sessionId),
          onSessionEnd: (sessionId, duration) =>
            this.handleSessionEnd(sessionId, duration),
        }
      );
      await this.sessionManager.initialize();

      // Initialize session analytics with current session start time
      const sessionId = this.sessionManager.getSessionId();
      if (sessionId) {
        // Use current time as session start time
        this.sessionAnalytics = new SessionAnalytics(Date.now());
      }

      // Initialize transport and queue if API key is provided
      if (this.config.apiKey) {
        this.transport = new Transport(
          {
            apiKey: this.config.apiKey,
            baseUrl: this.config.baseUrl,
            debug: this.config.debug,
          },
          this.logger
        );

        this.queue = new EventQueue(
          {
            maxQueueSize: this.config.maxQueueSize,
            flushInterval: this.config.flushInterval,
          },
          this.transport,
          this.logger
        );

        // Initialize queue (starts flush timer)
        await this.queue.initialize();
        this.logger.log("Event queue initialized");
      } else {
        this.logger.log(
          "No API key provided, events will only be tracked locally"
        );
      }

      // Set initialized BEFORE tracking auto events
      this._isInitialized = true;
      this.logger.log("Axyle initialized successfully");

      // Track app opened (after setting initialized flag)
      await this.trackAutoEvent(AUTO_TRACKED_EVENTS.APP_OPENED);

      // Set up app state listener
      this.setupAppStateListener();
    } catch (error) {
      this.logger.error("Failed to initialize Axyle:", error);
      this.logger.error("Error details:", error);
      // Set initialized anyway to prevent infinite waiting
      this._isInitialized = true;
      // Fail silently - don't throw
    }
  }

  /**
   * Track a custom event
   */
  async track(
    eventName: string,
    properties: EventProperties = {}
  ): Promise<void> {
    try {
      // Check if initialized and not opted out
      if (!this._isInitialized) {
        this.logger.warn("SDK not initialized, call init() first");
        return;
      }

      if (this.isOptedOut) {
        return;
      }

      // Validate event name
      if (!isValidEventName(eventName)) {
        this.logger.error("Invalid event name:", eventName);
        return;
      }

      // Update session activity
      await this.sessionManager.updateActivity();

      // Create event
      const event = await this.createEvent(eventName, properties);

      // Validate event size
      if (getObjectSize(event) > MAX_EVENT_SIZE) {
        this.logger.error("Event size exceeds limit:", eventName);
        return;
      }

      // Add to session analytics (local counting)
      if (this.sessionAnalytics) {
        this.sessionAnalytics.addEvent(event);
        this.logger.log(`Event tracked locally: ${eventName}`);
      }

      // Queue event for sending to API (if queue is initialized)
      if (this.queue) {
        await this.queue.enqueue(event);
      }
    } catch (error) {
      this.logger.error("Failed to track event:", error);
      // Fail silently
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, traits: UserTraits = {}): Promise<void> {
    try {
      if (!this._isInitialized || this.isOptedOut) {
        return;
      }

      // Capture previous user ID before updating
      const previousUserId = this.userId;

      // Store new user ID
      this.userId = userId;
      await Storage.setUserId(userId);

      // Track identify event with traits
      await this.track("User Identified", {
        ...traits,
        previousUserId: previousUserId || this.anonymousId,
      });

      this.logger.log("User identified:", userId);
    } catch (error) {
      this.logger.error("Failed to identify user:", error);
    }
  }

  /**
   * Reset user data (logout)
   */
  async reset(): Promise<void> {
    try {
      if (!this._isInitialized) {
        return;
      }

      // Clear user ID
      this.userId = null;
      await Storage.clearUserId();

      // Reset session
      await this.sessionManager.reset();

      this.logger.log("User data reset");
    } catch (error) {
      this.logger.error("Failed to reset:", error);
    }
  }

  /**
   * Opt out of tracking
   */
  async optOut(): Promise<void> {
    try {
      this.isOptedOut = true;
      await Storage.setOptOut(true);

      // Clear session analytics
      if (this.sessionAnalytics) {
        this.sessionAnalytics.clear();
      }

      this.logger.log("User opted out");
    } catch (error) {
      this.logger.error("Failed to opt out:", error);
    }
  }

  /**
   * Opt back in to tracking
   */
  async optIn(): Promise<void> {
    try {
      this.isOptedOut = false;
      await Storage.setOptOut(false);

      // Reinitialize session if it was cleared during opt-out
      if (!this.sessionManager || !this.sessionManager.getSessionId()) {
        this.sessionManager = new SessionManager(
          this.config.sessionTimeout,
          this.logger,
          {
            onSessionStart: (sessionId) => this.handleSessionStart(sessionId),
            onSessionEnd: (sessionId, duration) =>
              this.handleSessionEnd(sessionId, duration),
          }
        );
        await this.sessionManager.initialize();

        // Reinitialize session analytics
        const sessionId = this.sessionManager.getSessionId();
        if (sessionId) {
          this.sessionAnalytics = new SessionAnalytics(Date.now());
        }
      }

      this.logger.log("User opted in");
    } catch (error) {
      this.logger.error("Failed to opt in:", error);
    }
  }

  /**
   * Delete user data
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Track deletion request
      await this.track("User Deletion Requested", { userId });

      // Clear session analytics
      if (this.sessionAnalytics) {
        this.sessionAnalytics.clear();
      }

      // Clear local data
      await Storage.clearAll();

      this.logger.log("User deletion requested:", userId);
    } catch (error) {
      this.logger.error("Failed to delete user:", error);
    }
  }

  /**
   * Get session analytics statistics
   */
  getSessionStats(): SessionAnalyticsStats | null {
    if (!this.sessionAnalytics) {
      return null;
    }
    return this.sessionAnalytics.getStats();
  }

  /**
   * Get all events in current session
   */
  getSessionEvents(): AnalyticsEvent[] {
    if (!this.sessionAnalytics) {
      return [];
    }
    return this.sessionAnalytics.getEvents();
  }

  /**
   * Get events by type in current session
   */
  getEventsByType(eventName: string): AnalyticsEvent[] {
    if (!this.sessionAnalytics) {
      return [];
    }
    return this.sessionAnalytics.getEventsByType(eventName);
  }

  /**
   * Create an event object
   */
  private async createEvent(
    name: string,
    properties: EventProperties
  ): Promise<AnalyticsEvent> {
    const context = await ContextCollector.getContext(this.config.environment);

    // Get session ID, fallback to generating a temporary one if not available
    let sessionId = this.sessionManager?.getSessionId();
    if (!sessionId) {
      sessionId = `temp_session_${Date.now()}`;
      this.logger.warn("Session not initialized, using temporary session ID");
    }

    return {
      id: generateUUID(),
      name,
      properties: sanitizeProperties(properties),
      timestamp: Date.now(),
      userId: this.userId || this.anonymousId,
      anonymousId: this.anonymousId,
      sessionId,
      context,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  /**
   * Track an auto event
   */
  private async trackAutoEvent(
    eventName: string,
    properties: EventProperties = {}
  ): Promise<void> {
    await this.track(eventName, properties);
  }

  /**
   * Handle session start
   */
  private handleSessionStart(sessionId: string): void {
    // Initialize or reset session analytics for new session
    const sessionStartTime = Date.now();
    if (this.sessionAnalytics) {
      this.sessionAnalytics.resetSession(sessionStartTime);
    } else {
      this.sessionAnalytics = new SessionAnalytics(sessionStartTime);
    }

    this.trackAutoEvent(AUTO_TRACKED_EVENTS.SESSION_STARTED, { sessionId });
  }

  /**
   * Handle session end
   */
  private handleSessionEnd(sessionId: string, duration: number): void {
    this.trackAutoEvent(AUTO_TRACKED_EVENTS.SESSION_ENDED, {
      sessionId,
      duration,
    });
  }

  /**
   * Set up app state listener for background/foreground tracking
   */
  private setupAppStateListener(): void {
    let previousState: AppStateStatus = AppState.currentState;

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          previousState === "active" &&
          nextState.match(/inactive|background/)
        ) {
          // App went to background
          this.trackAutoEvent(AUTO_TRACKED_EVENTS.APP_BACKGROUNDED);
        } else if (
          previousState.match(/inactive|background/) &&
          nextState === "active"
        ) {
          // App came to foreground
          this.trackAutoEvent(AUTO_TRACKED_EVENTS.APP_FOREGROUNDED);
          this.sessionManager.updateActivity(); // Update session
        }
        previousState = nextState;
      }
    );
  }

  /**
   * Manually flush all queued events to the server
   */
  async flush(): Promise<void> {
    try {
      if (!this._isInitialized) {
        this.logger.warn("SDK not initialized, cannot flush");
        return;
      }

      if (this.queue) {
        await this.queue.flush();
        this.logger.log("Events flushed successfully");
      }
    } catch (error) {
      this.logger.error("Failed to flush events:", error);
    }
  }

  /**
   * Cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }

      // Shutdown queue (flushes remaining events)
      if (this.queue) {
        await this.queue.shutdown();
      }

      this._isInitialized = false;
      this.logger.log("Axyle shut down");
    } catch (error) {
      this.logger.error("Error during shutdown:", error);
    }
  }
}
