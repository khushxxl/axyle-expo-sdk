/**
 * Session Analytics Counter
 * Tracks and counts analytics events locally for the current session
 */

import { AnalyticsEvent } from "./types";

export interface SessionAnalyticsStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByScreen: Record<string, number>;
  sessionStartTime: number;
  sessionDuration: number;
  lastEventTime: number | null;
}

export class SessionAnalytics {
  private events: AnalyticsEvent[] = [];
  private sessionStartTime: number;
  private lastEventTime: number | null = null;

  constructor(sessionStartTime: number) {
    this.sessionStartTime = sessionStartTime;
  }

  /**
   * Add an event to the session analytics
   */
  addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    this.lastEventTime = Date.now();
  }

  /**
   * Get current session statistics
   */
  getStats(): SessionAnalyticsStats {
    const now = Date.now();
    const eventsByType: Record<string, number> = {};
    const eventsByScreen: Record<string, number> = {};

    // Count events by type and screen
    for (const event of this.events) {
      // Count by event name
      eventsByType[event.name] = (eventsByType[event.name] || 0) + 1;

      // Count by screen if available
      const screen = event.properties?.screen as string | undefined;
      if (screen) {
        eventsByScreen[screen] = (eventsByScreen[screen] || 0) + 1;
      }
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByScreen,
      sessionStartTime: this.sessionStartTime,
      sessionDuration: now - this.sessionStartTime,
      lastEventTime: this.lastEventTime,
    };
  }

  /**
   * Get all events in the session
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventName: string): AnalyticsEvent[] {
    return this.events.filter((event) => event.name === eventName);
  }

  /**
   * Clear all events (for new session)
   */
  clear(): void {
    this.events = [];
    this.lastEventTime = null;
  }

  /**
   * Reset session start time
   */
  resetSession(sessionStartTime: number): void {
    this.sessionStartTime = sessionStartTime;
    this.clear();
  }
}

