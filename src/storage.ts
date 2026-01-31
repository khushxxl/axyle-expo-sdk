/**
 * Storage layer using AsyncStorage for persistence
 * Handles event queue, user IDs, session data, and preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';
import { AnalyticsEvent, SessionData } from './types';
import { safeStringify } from './utils';

export class Storage {
  /**
   * Get all queued events
   */
  static async getQueuedEvents(): Promise<AnalyticsEvent[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS_QUEUE);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('[Axyle] Failed to get queued events:', error);
      return [];
    }
  }

  /**
   * Save events to queue
   */
  static async saveQueuedEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EVENTS_QUEUE,
        safeStringify(events)
      );
    } catch (error) {
      console.error('[Axyle] Failed to save queued events:', error);
    }
  }

  /**
   * Add event to queue
   */
  static async addEventToQueue(event: AnalyticsEvent): Promise<void> {
    try {
      const events = await this.getQueuedEvents();
      events.push(event);
      await this.saveQueuedEvents(events);
    } catch (error) {
      console.error('[Axyle] Failed to add event to queue:', error);
    }
  }

  /**
   * Remove events from queue
   */
  static async removeEventsFromQueue(eventIds: string[]): Promise<void> {
    try {
      const events = await this.getQueuedEvents();
      const filtered = events.filter((e) => !eventIds.includes(e.id));
      await this.saveQueuedEvents(filtered);
    } catch (error) {
      console.error('[Axyle] Failed to remove events from queue:', error);
    }
  }

  /**
   * Clear all queued events
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS_QUEUE);
    } catch (error) {
      console.error('[Axyle] Failed to clear queue:', error);
    }
  }

  /**
   * Get anonymous ID (create if doesn't exist)
   */
  static async getAnonymousId(): Promise<string> {
    try {
      let anonymousId = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
      if (!anonymousId) {
        // Generate new anonymous ID
        anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
      }
      return anonymousId;
    } catch (error) {
      console.error('[Axyle] Failed to get anonymous ID:', error);
      // Fallback to in-memory ID
      return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get user ID
   */
  static async getUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('[Axyle] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Set user ID
   */
  static async setUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('[Axyle] Failed to set user ID:', error);
    }
  }

  /**
   * Clear user ID (on reset/logout)
   */
  static async clearUserId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('[Axyle] Failed to clear user ID:', error);
    }
  }

  /**
   * Get session data
   */
  static async getSessionData(): Promise<SessionData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('[Axyle] Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Save session data
   */
  static async saveSessionData(session: SessionData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION_DATA,
        safeStringify(session)
      );
    } catch (error) {
      console.error('[Axyle] Failed to save session data:', error);
    }
  }

  /**
   * Clear session data
   */
  static async clearSessionData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
    } catch (error) {
      console.error('[Axyle] Failed to clear session data:', error);
    }
  }

  /**
   * Check if user has opted out
   */
  static async isOptedOut(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.OPT_OUT);
      return value === 'true';
    } catch (error) {
      console.error('[Axyle] Failed to check opt-out status:', error);
      return false;
    }
  }

  /**
   * Set opt-out status
   */
  static async setOptOut(optOut: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OPT_OUT, optOut ? 'true' : 'false');
    } catch (error) {
      console.error('[Axyle] Failed to set opt-out status:', error);
    }
  }

  /**
   * Clear all analytics data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EVENTS_QUEUE,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.SESSION_DATA,
        STORAGE_KEYS.OPT_OUT,
        // Keep anonymous ID for continuity
      ]);
    } catch (error) {
      console.error('[Axyle] Failed to clear all data:', error);
    }
  }
}

