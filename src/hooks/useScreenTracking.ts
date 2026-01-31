/**
 * React hook for automatic screen tracking with time tracking
 */

import { useEffect, useRef } from "react";
import { track } from "../core";

export interface ScreenTrackingOptions {
  /** Screen name to track */
  screenName: string;
  /** Additional properties to track with screen view */
  properties?: Record<string, any>;
  /** Whether to track time spent on screen (default: true) */
  trackTime?: boolean;
}

/**
 * Hook to automatically track screen views with time tracking
 *
 * @example
 * ```tsx
 * function HomeScreen() {
 *   useScreenTracking({ screenName: 'Home' });
 *   return <View>...</View>;
 * }
 * ```
 */
export function useScreenTracking(options: ScreenTrackingOptions): void {
  const { screenName, properties = {}, trackTime = true } = options;
  const hasTracked = useRef(false);
  const screenStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Track screen view only once when component mounts
    if (!hasTracked.current) {
      const startTime = Date.now();
      screenStartTime.current = startTime;

      track("Screen Viewed", {
        screen: screenName,
        screen_start_time: startTime,
        ...properties,
      });
      hasTracked.current = true;
    }

    // Track screen time when component unmounts
    return () => {
      if (trackTime && screenStartTime.current !== null) {
        const endTime = Date.now();
        const duration = endTime - screenStartTime.current;

        track("Screen Time", {
          screen: screenName,
          duration_ms: duration,
          duration_seconds: Math.round(duration / 1000),
          screen_start_time: screenStartTime.current,
          screen_end_time: endTime,
          ...properties,
        });
      }
    };
  }, [screenName, properties, trackTime]);
}
