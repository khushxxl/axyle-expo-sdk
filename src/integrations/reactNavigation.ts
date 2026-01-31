/**
 * React Navigation integration for automatic screen tracking
 */

import { track } from '../core';

/**
 * Get the current route name from navigation state
 */
function getActiveRouteName(state: any): string | undefined {
  if (!state || typeof state.index !== 'number') {
    return undefined;
  }

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}

/**
 * Create a navigation state change handler for React Navigation
 * 
 * @example
 * ```tsx
 * import { NavigationContainer } from '@react-navigation/native';
 * import { createNavigationTracker } from '@axyle/expo-sdk';
 * 
 * const navigationTracker = createNavigationTracker();
 * 
 * function App() {
 *   return (
 *     <NavigationContainer
 *       onStateChange={navigationTracker}
 *     >
 *       {/* Your navigators *\/}
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function createNavigationTracker() {
  let previousRouteName: string | undefined;

  return (state: any) => {
    const currentRouteName = getActiveRouteName(state);

    if (currentRouteName && currentRouteName !== previousRouteName) {
      // Track screen view
      track('Screen Viewed', {
        screen: currentRouteName,
        previousScreen: previousRouteName || null,
      });

      previousRouteName = currentRouteName;
    }
  };
}

/**
 * Alternative: Get navigation ref and track manually
 * 
 * @example
 * ```tsx
 * import { NavigationContainer } from '@react-navigation/native';
 * import { trackNavigationReady, trackNavigationStateChange } from '@axyle/expo-sdk';
 * 
 * const navigationRef = createNavigationContainerRef();
 * 
 * function App() {
 *   return (
 *     <NavigationContainer
 *       ref={navigationRef}
 *       onReady={() => trackNavigationReady(navigationRef)}
 *       onStateChange={() => trackNavigationStateChange(navigationRef)}
 *     >
 *       {/* Your navigators *\/}
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
let currentRouteName: string | undefined;

export function trackNavigationReady(navigationRef: any): void {
  currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
  if (currentRouteName) {
    track('Screen Viewed', {
      screen: currentRouteName,
    });
  }
}

export function trackNavigationStateChange(navigationRef: any): void {
  const previousRouteName = currentRouteName;
  const route = navigationRef.current?.getCurrentRoute();
  currentRouteName = route?.name;

  if (currentRouteName && currentRouteName !== previousRouteName) {
    track('Screen Viewed', {
      screen: currentRouteName,
      previousScreen: previousRouteName || null,
      params: route?.params || {},
    });
  }
}

