# Axyle Analytics SDK

A privacy-focused, lightweight analytics SDK for Expo and React Native applications.

## Features

- **Simple Integration** - One-line initialization with just an API key
- **Automatic Tracking** - App lifecycle, sessions, and screen views
- **Offline Support** - Events are queued and sent when connection is available
- **Privacy First** - No PII collected by default, opt-out support, GDPR-compliant data deletion
- **Zero Configuration** - Sensible defaults for all settings
- **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install @axyle/expo-sdk
```

### Peer Dependencies

Install the required peer dependencies:

```bash
npx expo install expo-application expo-constants expo-device @react-native-async-storage/async-storage
```

## Quick Start

### 1. Initialize the SDK

Initialize the SDK in your app's entry point (e.g., `App.tsx` or `_layout.tsx`):

```tsx
import { useEffect } from "react";
import { Axyle } from "@axyle/expo-sdk";

export default function App() {
  useEffect(() => {
    Axyle.init("your-api-key");
  }, []);

  return <YourApp />;
}
```

### 2. Track Custom Events

```tsx
import { Axyle } from "@axyle/expo-sdk";

// Track a button click
Axyle.track("Button Clicked", {
  button: "Sign Up",
  screen: "Home",
});

// Track a purchase
Axyle.track("Purchase Completed", {
  amount: 29.99,
  currency: "USD",
  productId: "premium-plan",
});
```

### 3. Identify Users

```tsx
// When user logs in
Axyle.identify("user-123", {
  email: "user@example.com",
  plan: "premium",
});

// When user logs out
Axyle.reset();
```

## API Reference

### Core Methods

#### `Axyle.init(apiKey)`

Initialize the SDK. Must be called before any other methods.

```tsx
// Pass API key as a string
Axyle.init("your-api-key");

// Or as an object
Axyle.init({ apiKey: "your-api-key" });
```

#### `Axyle.track(eventName, properties?)`

Track a custom event with optional properties.

```tsx
Axyle.track("Video Watched", {
  videoId: "abc123",
  duration: 120,
  quality: "HD",
});
```

**Property Types:** Properties must be primitives (string, number, boolean, null).

#### `Axyle.identify(userId, traits?)`

Associate events with a user ID and optional traits.

```tsx
Axyle.identify("user-123", {
  email: "user@example.com",
  plan: "premium",
});
```

#### `Axyle.reset()`

Clear user data and start a new session. Call this on logout.

```tsx
Axyle.reset();
```

#### `Axyle.flush()`

Manually flush all queued events to the server.

```tsx
await Axyle.flush();
```

#### `Axyle.shutdown()`

Gracefully shutdown the SDK (flushes events and cleans up resources).

```tsx
await Axyle.shutdown();
```

### Privacy Methods

#### `Axyle.optOut()`

Opt out of tracking. Stops all event collection.

```tsx
Axyle.optOut();
```

#### `Axyle.optIn()`

Opt back in to tracking.

```tsx
Axyle.optIn();
```

#### `Axyle.deleteUser(userId)`

Request deletion of user data (GDPR compliance).

```tsx
Axyle.deleteUser("user-123");
```

### Analytics Methods

#### `Axyle.getSessionStats()`

Get current session statistics.

```tsx
const stats = Axyle.getSessionStats();
// { totalEvents: 15, eventsByType: { 'Button Clicked': 3, ... }, ... }
```

#### `Axyle.getSessionEvents()`

Get all events in the current session.

```tsx
const events = Axyle.getSessionEvents();
```

#### `Axyle.getEventsByType(eventName)`

Get events filtered by type.

```tsx
const buttonClicks = Axyle.getEventsByType("Button Clicked");
```

## Screen Tracking

### Manual Screen Tracking (Recommended)

```tsx
import { useEffect } from "react";
import { trackScreen } from "@axyle/expo-sdk";

export default function HomeScreen() {
  useEffect(() => {
    trackScreen("Home");
  }, []);

  return <View>...</View>;
}

// With additional properties
export default function ProductScreen({ productId }) {
  useEffect(() => {
    trackScreen("Product", { productId });
  }, [productId]);

  return <View>...</View>;
}
```

### Using the Screen Tracking Hook

```tsx
import { useScreenTracking } from "@axyle/expo-sdk";

function HomeScreen() {
  useScreenTracking({
    screenName: "Home",
    properties: { section: "main" },
    trackTime: true, // Track time spent on screen
  });

  return <View>...</View>;
}
```

### React Navigation Integration

```tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNavigationTracker } from "@axyle/expo-sdk";

const navigationTracker = createNavigationTracker();

function App() {
  return (
    <NavigationContainer onStateChange={navigationTracker}>
      {/* Your navigators */}
    </NavigationContainer>
  );
}
```

## Flow Tracking

Track multi-step user flows like onboarding, checkout, or tutorials:

```tsx
import {
  useFlowTracking,
  trackFlowCompleted,
  trackFlowAbandoned,
} from "@axyle/expo-sdk";

// In each step component
function OnboardingStep1() {
  useFlowTracking({
    flowId: "welcome-onboarding",
    flowType: "onboarding",
    step: 1,
    totalSteps: 4,
    stepName: "Welcome",
  });

  return <View>...</View>;
}

// When flow completes
function OnboardingComplete() {
  useEffect(() => {
    trackFlowCompleted("welcome-onboarding", 4, { flowType: "onboarding" });
  }, []);

  return <View>...</View>;
}

// When user abandons flow (e.g., closes modal)
const handleClose = () => {
  trackFlowAbandoned("welcome-onboarding", currentStep, 4, {
    flowType: "onboarding",
    stepName: "Current Step Name",
  });
};
```

## Feature Tracking

Track feature usage and discovery:

```tsx
import { trackFeatureUsage, useFeatureViewTracking } from "@axyle/expo-sdk";

// Track when a feature is used
const handleShare = () => {
  trackFeatureUsage("share", { screen: "Article", method: "button" });
  // ... share logic
};

// Track when a feature is viewed/discovered
function NewFeatureBanner() {
  useFeatureViewTracking("premium-upgrade-banner", { location: "home" });

  return <View>...</View>;
}
```

## Scroll Tracking

Track scroll depth on content screens:

```tsx
import { useScrollTracking, useWebScrollTracking } from "@axyle/expo-sdk";

// React Native
function ArticleScreen() {
  const scrollViewRef = useScrollTracking({
    screenName: "Article",
    thresholds: [25, 50, 75, 100],
  });

  return <ScrollView ref={scrollViewRef}>{/* content */}</ScrollView>;
}

// Web
function WebArticle() {
  useWebScrollTracking({
    screenName: "Article",
    thresholds: [25, 50, 75, 100],
  });

  return <div>...</div>;
}
```

## Automatically Tracked Events

The SDK automatically tracks:

| Event              | Description                           |
| ------------------ | ------------------------------------- |
| `App Opened`       | App launches                          |
| `App Backgrounded` | App goes to background                |
| `App Foregrounded` | App returns to foreground             |
| `Session Started`  | New session begins                    |
| `Session Ended`    | Session expires (30 min inactivity)   |
| `Screen Viewed`    | Screen navigation (with integrations) |

## Event Schema

Each event includes:

```typescript
{
  id: string;              // Unique event ID
  name: string;            // Event name
  properties: object;      // Custom properties
  timestamp: number;       // Unix timestamp (ms)
  userId: string;          // User or anonymous ID
  anonymousId: string;     // Persistent anonymous ID
  sessionId: string;       // Current session ID
  schemaVersion: string;   // Schema version
  context: {
    app: { name, version, build, namespace },
    device: { id, manufacturer, model, name, type, brand },
    os: { name, version },
    screen: { width, height, density },
    locale: string,
    timezone: string,
    environment: 'dev' | 'prod'
  }
}
```

## Configuration

The SDK uses sensible defaults:

| Setting         | Default    | Description                     |
| --------------- | ---------- | ------------------------------- |
| Queue Size      | 100 events | Max events before auto-flush    |
| Flush Interval  | 10 seconds | Auto-flush interval             |
| Session Timeout | 30 minutes | Inactivity timeout for sessions |
| Retry Attempts  | 3          | Network retry attempts          |
| Batch Size      | 500 KB     | Max batch size                  |

These settings are optimized for mobile and cannot be overridden.

## Best Practices

### 1. Initialize Early

Initialize in your root component before rendering any screens:

```tsx
function App() {
  useEffect(() => {
    Axyle.init("your-api-key");
  }, []);

  return <YourApp />;
}
```

### 2. Use Descriptive Event Names

```tsx
// Good
Axyle.track('Checkout Completed', { ... });
Axyle.track('Profile Photo Updated', { ... });

// Avoid
Axyle.track('click', { ... });
Axyle.track('event1', { ... });
```

### 3. Keep Properties Simple

Use primitive types for properties:

```tsx
// Good
Axyle.track("Item Added", {
  itemId: "123",
  price: 29.99,
  quantity: 2,
});

// Avoid nested objects
```

### 4. Flush Before Critical Actions

```tsx
async function logout() {
  await Axyle.flush();
  Axyle.reset();
  // ... logout logic
}
```

### 5. Respect User Privacy

```tsx
function SettingsScreen() {
  const [optedOut, setOptedOut] = useState(false);

  const handleOptOut = async () => {
    if (optedOut) {
      await Axyle.optIn();
    } else {
      await Axyle.optOut();
    }
    setOptedOut(!optedOut);
  };

  return (
    <View>
      <Text>Analytics</Text>
      <Switch value={!optedOut} onValueChange={handleOptOut} />
    </View>
  );
}
```

## Troubleshooting

### Events Not Sending

1. Verify your API key is correct
2. Check network connectivity
3. Call `Axyle.flush()` to force send events
4. Check if user has opted out

### TypeScript Errors

Ensure peer dependencies are installed:

```bash
npm install --save-dev @types/react @types/react-native
```

### Expo Go Issues

1. Restart Expo Go
2. Clear cache: `npx expo start -c`
3. Reinstall dependencies

### SDK Not Initializing

Ensure you're calling `init()` before any other SDK methods:

```tsx
// Correct order
await Axyle.init("api-key");
Axyle.track("Event", {});

// Wrong - track called before init
Axyle.track("Event", {});
Axyle.init("api-key");
```

## TypeScript

The SDK is fully typed. Import types as needed:

```tsx
import type {
  AnalyticsEvent,
  EventProperties,
  UserTraits,
  SessionAnalyticsStats,
} from "@axyle/expo-sdk";
```

## License

MIT

## Support

- GitHub Issues: [Report a bug](https://github.com/axyle/expo-sdk/issues)
- Documentation: [docs.axyle.com](https://docs.axyle.com)
