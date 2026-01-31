/**
 * Session management with 30-minute timeout
 */

import { SessionData } from './types';
import { Storage } from './storage';
import { generateUUID } from './utils';

export class SessionManager {
  private sessionTimeout: number;
  private currentSession: SessionData | null = null;
  private logger: any;
  private onSessionStart?: (sessionId: string) => void;
  private onSessionEnd?: (sessionId: string, duration: number) => void;

  constructor(
    sessionTimeout: number,
    logger: any,
    callbacks?: {
      onSessionStart?: (sessionId: string) => void;
      onSessionEnd?: (sessionId: string, duration: number) => void;
    }
  ) {
    this.sessionTimeout = sessionTimeout;
    this.logger = logger;
    this.onSessionStart = callbacks?.onSessionStart;
    this.onSessionEnd = callbacks?.onSessionEnd;
  }

  /**
   * Initialize session manager
   * Loads existing session or creates new one
   */
  async initialize(): Promise<void> {
    try {
      const savedSession = await Storage.getSessionData();
      const now = Date.now();

      if (savedSession) {
        // Check if session is still valid
        const timeSinceLastActivity = now - savedSession.lastActivityTime;
        
        if (timeSinceLastActivity < this.sessionTimeout) {
          // Resume existing session
          this.currentSession = savedSession;
          this.logger.log('Resumed existing session:', savedSession.sessionId);
          await this.updateActivity();
        } else {
          // Session expired, end it and start new one
          this.logger.log('Session expired, starting new session');
          await this.endSession(savedSession);
          await this.startNewSession();
        }
      } else {
        // No existing session, start new one
        await this.startNewSession();
      }
    } catch (error) {
      this.logger.error('Failed to initialize session:', error);
      // Start new session as fallback
      await this.startNewSession();
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    if (!this.currentSession) {
      return null;
    }
    return this.currentSession.sessionId;
  }

  /**
   * Update last activity time
   * Checks if session should be renewed
   */
  async updateActivity(): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.currentSession.lastActivityTime;

    // If session expired, end it and start new one
    if (timeSinceLastActivity >= this.sessionTimeout) {
      this.logger.log('Session timeout detected, starting new session');
      await this.endSession(this.currentSession);
      await this.startNewSession();
    } else {
      // Update activity time
      this.currentSession.lastActivityTime = now;
      await Storage.saveSessionData(this.currentSession);
    }
  }

  /**
   * Start a new session
   */
  private async startNewSession(): Promise<void> {
    const now = Date.now();
    const sessionId = `session_${now}_${generateUUID()}`;

    this.currentSession = {
      sessionId,
      startTime: now,
      lastActivityTime: now,
    };

    await Storage.saveSessionData(this.currentSession);
    this.logger.log('Started new session:', sessionId);

    // Trigger callback
    if (this.onSessionStart) {
      try {
        this.onSessionStart(sessionId);
      } catch (error) {
        this.logger.error('Error in onSessionStart callback:', error);
      }
    }
  }

  /**
   * End a session
   */
  private async endSession(session: SessionData): Promise<void> {
    const duration = session.lastActivityTime - session.startTime;
    this.logger.log(`Ended session ${session.sessionId}, duration: ${duration}ms`);

    // Trigger callback
    if (this.onSessionEnd) {
      try {
        this.onSessionEnd(session.sessionId, duration);
      } catch (error) {
        this.logger.error('Error in onSessionEnd callback:', error);
      }
    }
  }

  /**
   * Force end current session
   */
  async forceEndSession(): Promise<void> {
    if (this.currentSession) {
      await this.endSession(this.currentSession);
      await Storage.clearSessionData();
      this.currentSession = null;
    }
  }

  /**
   * Reset session (start fresh)
   */
  async reset(): Promise<void> {
    await this.forceEndSession();
    await this.startNewSession();
  }
}

