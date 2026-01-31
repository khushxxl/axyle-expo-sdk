/**
 * Configuration Loader
 *
 * Handles API key validation for the SDK.
 */

/**
 * Validate API key format
 * Adjust the regex pattern based on your platform's API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // UUID format: 550e8400-e29b-41d4-a716-446655440000
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Alphanumeric with dashes/underscores: at least 32 characters
  const alphanumericRegex = /^[a-zA-Z0-9_-]{32,}$/;

  return uuidRegex.test(apiKey) || alphanumericRegex.test(apiKey);
}
