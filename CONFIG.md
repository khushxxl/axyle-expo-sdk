# Configuration Guide

This guide explains how to configure the Axyle Analytics SDK with your API key.

## Getting Your API Key

1. Sign up at your analytics platform dashboard
2. Create a new project
3. Copy your API key from the project settings
4. Use it to initialize the SDK

## Configuration

The SDK is designed to be simple - you only need to provide your API key:

```typescript
import { Axyle } from "@axyle/expo-sdk";

// Simple: just pass the API key as a string
Axyle.init("your-api-key-from-platform");

// Or as an object (both work the same)
Axyle.init({ apiKey: "your-api-key-from-platform" });
```

That's it! The SDK uses sensible defaults for all other settings:

- Production server (always)
- Optimal queue and flush settings
- Automatic session management
- App lifecycle tracking

## Setting User ID

User ID should be set at runtime using the `identify()` method:

```typescript
// After user logs in
Axyle.identify("user-123", {
  email: "user@example.com",
  plan: "premium",
});
```

This is the recommended approach as it allows you to track anonymous users before they log in.

## API Key Format

Your API key should be in one of these formats:

- UUID: `550e8400-e29b-41d4-a716-446655440000`
- Alphanumeric: At least 32 characters (e.g., `abc123def456ghi789jkl012mno345pqr`)

## Security Best Practices

1. **Never commit API keys to version control**
   - Store API keys in environment variables
   - Use secure storage for API keys in production apps
   - Consider using a secrets management service

2. **Use environment variables for API keys**

   ```typescript
   Axyle.init(process.env.EXPO_ANALYTICS_API_KEY || "");
   ```

3. **Use different API keys for dev and prod**
   ```typescript
   Axyle.init(__DEV__ ? "dev-api-key" : "prod-api-key");
   ```

## Example: Complete Setup

```typescript
import { Axyle } from '@axyle/expo-sdk';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Initialize SDK - just pass your API key
    Axyle.init('your-api-key-from-platform');
  }, []);

  // Later, when user logs in
  const handleLogin = async (userId: string, email: string) => {
    await Axyle.identify(userId, {
      email,
      loginMethod: 'email',
    });
  };

  return (
    // Your app content
  );
}
```

## Troubleshooting

### "API key is required" warning

- Make sure you've passed a valid API key string
- Check that the API key is not empty

### Invalid API key format

- Verify your API key matches the expected format (UUID or 32+ character alphanumeric)
- Check for extra spaces or special characters
- Use the `isValidApiKeyFormat()` utility if needed:

```typescript
import { isValidApiKeyFormat } from "@axyle/expo-sdk";

if (isValidApiKeyFormat("your-api-key")) {
  Axyle.init("your-api-key");
}
```
