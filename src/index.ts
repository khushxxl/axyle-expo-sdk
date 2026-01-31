/**
 * Axyle Analytics SDK
 * Main entry point
 */

import { client, track } from "./core";
import type {
  AnalyticsEvent,
  AxyleInitConfig,
  EventContext,
  EventProperties,
  UserTraits,
} from "./types";

/**
 * Axyle - Main SDK interface
 */
export const Axyle = {
  /**
   * Initialize the SDK with your API key and optional user ID
   *
   * @example
   * ```ts
   * // Simple: just pass the API key as a string
   * Axyle.init('your-api-key');
   *
   * // With optional user ID (e.g., pre-authenticated user)
   * Axyle.init({
   *   apiKey: 'your-api-key',
   *   userId: 'user-123'
   * });
   * ```
   */
  init: (config: AxyleInitConfig) => client.init(config),

  /**
   * Track a custom event
   *
   * @example
   * ```ts
   * Axyle.track('Button Clicked', {
   *   button: 'Sign Up',
   *   screen: 'Home'
   * });
   * ```
   */
  track: (eventName: string, properties?: EventProperties) =>
    client.track(eventName, properties),

  /**
   * Identify a user
   *
   * @example
   * ```ts
   * Axyle.identify('user-123', {
   *   email: 'user@example.com',
   *   plan: 'premium'
   * });
   * ```
   */
  identify: (userId: string, traits?: UserTraits) =>
    client.identify(userId, traits),

  /**
   * Reset user data (call on logout)
   *
   * @example
   * ```ts
   * Axyle.reset();
   * ```
   */
  reset: () => client.reset(),

  /**
   * Opt out of tracking
   *
   * @example
   * ```ts
   * Axyle.optOut();
   * ```
   */
  optOut: () => client.optOut(),

  /**
   * Opt back in to tracking
   *
   * @example
   * ```ts
   * Axyle.optIn();
   * ```
   */
  optIn: () => client.optIn(),

  /**
   * Request user data deletion
   *
   * @example
   * ```ts
   * Axyle.deleteUser('user-123');
   * ```
   */
  deleteUser: (userId: string) => client.deleteUser(userId),

  /**
   * Manually flush all queued events to the server
   *
   * @example
   * ```ts
   * await Axyle.flush();
   * ```
   */
  flush: () => client.flush(),

  /**
   * Shutdown the SDK (flushes events and cleans up resources)
   *
   * @example
   * ```ts
   * await Axyle.shutdown();
   * ```
   */
  shutdown: () => client.shutdown(),

  /**
   * Get session analytics statistics
   *
   * @example
   * ```ts
   * const stats = Axyle.getSessionStats();
   * console.log('Total events:', stats?.totalEvents);
   * ```
   */
  getSessionStats: () => client.getSessionStats(),

  /**
   * Get all events in current session
   *
   * @example
   * ```ts
   * const events = Axyle.getSessionEvents();
   * ```
   */
  getSessionEvents: () => client.getSessionEvents(),

  /**
   * Get events by type in current session
   *
   * @example
   * ```ts
   * const buttonClicks = Axyle.getEventsByType('Button Clicked');
   * ```
   */
  getEventsByType: (eventName: string) => client.getEventsByType(eventName),
};

// Export types
export type {
  AnalyticsEvent,
  AxyleInitConfig,
  EventContext,
  EventProperties,
  UserTraits,
};

// Export session analytics types
export type { SessionAnalyticsStats } from "./sessionAnalytics";

// Export API key validation utility (still useful)
export { isValidApiKeyFormat } from "./configLoader";

// Export hooks and integrations
export {
  trackFeatureUsage,
  trackFeatureUsageWithContext,
  useFeatureViewTracking,
} from "./hooks/useFeatureTracking";
export {
  trackFlowAbandoned,
  trackFlowCompleted,
  trackOnboardingAbandoned,
  trackOnboardingCompleted,
  useFlowTracking,
  // Legacy exports for backward compatibility
  useOnboardingTracking,
} from "./hooks/useOnboardingTracking";
export type { FlowTrackingOptions } from "./hooks/useOnboardingTracking";
export { useScreenTracking } from "./hooks/useScreenTracking";
export {
  useScrollTracking,
  useWebScrollTracking,
} from "./hooks/useScrollTracking";
export {
  createNavigationTracker,
  trackNavigationReady,
  trackNavigationStateChange,
} from "./integrations/reactNavigation";

// Manual screen tracking helper
// Use this in your screens instead of automatic tracking
export function trackScreen(
  screenName: string,
  properties?: Record<string, any>
): void {
  // Add a small delay to ensure SDK is initialized
  setTimeout(() => {
    track("Screen Viewed", {
      screen: screenName,
      ...properties,
    });
  }, 100);
}

// Default export
export default Axyle;
