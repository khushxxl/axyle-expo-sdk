/**
 * React hook and utilities for feature usage tracking
 */

import { useEffect, useRef } from "react";
import { track } from "../core";

/**
 * Track when a feature is used
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const handleEditProfile = () => {
 *     trackFeatureUsage('edit_profile', { screen: 'Profile' });
 *     // ... edit profile logic
 *   };
 *   
 *   return <Button onPress={handleEditProfile}>Edit Profile</Button>;
 * }
 * ```
 */
export function trackFeatureUsage(
  featureName: string,
  properties?: Record<string, any>
): void {
  track("Feature Used", {
    feature: featureName,
    ...properties,
  });
}

/**
 * Track feature usage with additional context
 */
export function trackFeatureUsageWithContext(
  featureName: string,
  context: {
    screen?: string;
    category?: string;
    action?: string;
    value?: number | string;
    [key: string]: any;
  }
): void {
  track("Feature Used", {
    feature: featureName,
    feature_category: context.category,
    feature_action: context.action,
    feature_value: context.value,
    screen: context.screen,
    ...context,
  });
}

/**
 * Hook to automatically track feature usage on component mount
 * Useful for tracking feature discovery/views
 */
export function useFeatureViewTracking(
  featureName: string,
  properties?: Record<string, any>
): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      track("Feature Viewed", {
        feature: featureName,
        ...properties,
      });
      hasTracked.current = true;
    }
  }, [featureName, properties]);
}

