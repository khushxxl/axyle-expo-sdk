/**
 * React hook for scroll tracking
 */

import { useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { track } from "../core";

export interface ScrollTrackingOptions {
  /** Screen/page name where scroll is being tracked */
  screenName: string;
  /** Additional properties to track with scroll events */
  properties?: Record<string, any>;
  /** Threshold percentages to track (default: [25, 50, 75, 100]) */
  thresholds?: number[];
  /** Minimum scroll distance before tracking (default: 100) */
  minScrollDistance?: number;
}

/**
 * Hook to automatically track scroll depth on ScrollView
 *
 * @example
 * ```tsx
 * function ArticleScreen() {
 *   const scrollViewRef = useScrollTracking({ 
 *     screenName: 'Article',
 *     thresholds: [25, 50, 75, 100]
 *   });
 *   
 *   return (
 *     <ScrollView ref={scrollViewRef}>
 *       {/* content *\/}
 *     </ScrollView>
 *   );
 * }
 * ```
 */
export function useScrollTracking(options: ScrollTrackingOptions) {
  const {
    screenName,
    properties = {},
    thresholds = [25, 50, 75, 100],
    minScrollDistance = 100,
  } = options;

  const scrollViewRef = useRef<ScrollView>(null);
  const trackedThresholds = useRef<Set<number>>(new Set());
  const lastScrollY = useRef<number>(0);
  const contentHeight = useRef<number>(0);
  const scrollViewHeight = useRef<number>(0);

  useEffect(() => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    const handleScroll = (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollY = contentOffset.y;
      const contentHeightValue = contentSize.height;
      const scrollViewHeightValue = layoutMeasurement.height;

      contentHeight.current = contentHeightValue;
      scrollViewHeight.current = scrollViewHeightValue;

      // Calculate scroll percentage
      const maxScroll = Math.max(0, contentHeightValue - scrollViewHeightValue);
      if (maxScroll === 0) return;

      const scrollPercentage = Math.round((scrollY / maxScroll) * 100);
      const scrollDistance = Math.abs(scrollY - lastScrollY.current);

      // Only track if minimum scroll distance is met
      if (scrollDistance < minScrollDistance) return;

      lastScrollY.current = scrollY;

      // Track threshold milestones
      for (const threshold of thresholds) {
        if (
          scrollPercentage >= threshold &&
          !trackedThresholds.current.has(threshold)
        ) {
          trackedThresholds.current.add(threshold);

          track("Scroll Depth", {
            screen: screenName,
            scroll_percentage: scrollPercentage,
            scroll_threshold: threshold,
            scroll_y: scrollY,
            content_height: contentHeightValue,
            viewport_height: scrollViewHeightValue,
            ...properties,
          });
        }
      }

      // Track general scroll event periodically (every 10% scroll)
      const scrollBucket = Math.floor(scrollPercentage / 10) * 10;
      if (scrollBucket > 0 && scrollBucket % 10 === 0) {
        track("Scroll Event", {
          screen: screenName,
          scroll_percentage: scrollPercentage,
          scroll_y: scrollY,
          ...properties,
        });
      }
    };

    // Note: ScrollView doesn't have a direct onScroll prop in React Native
    // This would need to be implemented differently for React Native
    // For web, we can use onScroll directly
    if (scrollView && "addEventListener" in scrollView) {
      // Web implementation
      (scrollView as any).addEventListener("scroll", handleScroll);
      return () => {
        (scrollView as any).removeEventListener("scroll", handleScroll);
      };
    }
  }, [screenName, properties, thresholds, minScrollDistance]);

  return scrollViewRef;
}

/**
 * Hook for tracking scroll on web pages
 * Use this for web/React implementations
 */
export function useWebScrollTracking(options: ScrollTrackingOptions) {
  const {
    screenName,
    properties = {},
    thresholds = [25, 50, 75, 100],
    minScrollDistance = 100,
  } = options;

  const trackedThresholds = useRef<Set<number>>(new Set());
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      // Type guard for web environment
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }
      
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;

      if (maxScroll === 0) return;

      const scrollPercentage = Math.round((scrollY / maxScroll) * 100);
      const scrollDistance = Math.abs(scrollY - lastScrollY.current);

      if (scrollDistance < minScrollDistance) return;

      lastScrollY.current = scrollY;

      // Track threshold milestones
      for (const threshold of thresholds) {
        if (
          scrollPercentage >= threshold &&
          !trackedThresholds.current.has(threshold)
        ) {
          trackedThresholds.current.add(threshold);

          track("Scroll Depth", {
            screen: screenName,
            scroll_percentage: scrollPercentage,
            scroll_threshold: threshold,
            scroll_y: scrollY,
            content_height: documentHeight,
            viewport_height: windowHeight,
            ...properties,
          });
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [screenName, properties, thresholds, minScrollDistance]);
}

