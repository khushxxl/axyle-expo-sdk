/**
 * Core SDK module - exports the singleton client instance
 * This module is used to avoid circular dependencies between index.ts and integrations
 */

import { AxyleClient } from "./client";
import type { EventProperties } from "./types";

// Create and export singleton instance
export const client = new AxyleClient();

// Maximum retries when SDK is not initialized
const MAX_INIT_RETRIES = 50; // 5 seconds max (50 * 100ms)

// Export a track function that can be used by integrations
// Note: client.track is async, but we call it without awaiting to avoid blocking
export function track(eventName: string, properties?: EventProperties): void {
  // Check if initialized before tracking
  if (!client.isInitialized) {
    // Queue the event to be tracked once initialized
    let retryCount = 0;
    const checkAndTrack = () => {
      if (client.isInitialized) {
        client.track(eventName, properties).catch(() => {
          // Silently handle errors - track already handles errors internally
        });
      } else if (retryCount < MAX_INIT_RETRIES) {
        retryCount++;
        setTimeout(checkAndTrack, 100);
      }
      // After max retries, silently drop the event
    };
    checkAndTrack();
    return;
  }

  // Fire and forget - track is async but we don't need to wait for it
  client.track(eventName, properties).catch(() => {
    // Silently handle errors - track already handles errors internally
  });
}

// Export isInitialized getter for integrations to check
export function isInitialized(): boolean {
  return client.isInitialized;
}
