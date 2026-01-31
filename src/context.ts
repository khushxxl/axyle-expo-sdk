/**
 * Device and app context collection using Expo APIs
 */

import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Dimensions, Platform } from "react-native";
import { EventContext } from "./types";

export class ContextCollector {
  private static cachedContext: EventContext | null = null;

  /**
   * Get device and app context
   * Caches result for performance
   */
  static async getContext(environment: "dev" | "prod"): Promise<EventContext> {
    // Return cached context if available
    if (this.cachedContext) {
      return this.cachedContext;
    }

    try {
      const { width, height } = Dimensions.get("window");
      const scale = Dimensions.get("window").scale;

      const context: EventContext = {
        app: {
          name: Application.applicationName || "Unknown",
          version: Application.nativeApplicationVersion || "0.0.0",
          build: Application.nativeBuildVersion || "0",
          namespace: Application.applicationId || "unknown",
        },
        device: {
          id: await this.getDeviceId(),
          manufacturer: Device.manufacturer || null,
          model: Device.modelName || null,
          name: Device.deviceName || null,
          type: this.getDeviceType(),
          brand: Device.brand || null,
        },
        os: {
          name: Platform.OS,
          version: Platform.Version.toString(),
        },
        screen: {
          width,
          height,
          density: scale,
        },
        locale: this.getLocale(),
        timezone: this.getTimezone(),
        environment,
      };

      // Cache the context
      this.cachedContext = context;
      return context;
    } catch (error) {
      console.error("[Axyle] Failed to collect context:", error);
      // Return minimal context on error
      return this.getMinimalContext(environment);
    }
  }

  /**
   * Get device ID (may be null on some platforms)
   */
  private static async getDeviceId(): Promise<string | null> {
    try {
      // Use Android ID on Android, IDFV on iOS
      if (Platform.OS === "android") {
        return Constants.sessionId || null;
      } else if (Platform.OS === "ios") {
        return Constants.sessionId || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine device type
   */
  private static getDeviceType():
    | "PHONE"
    | "TABLET"
    | "DESKTOP"
    | "TV"
    | "UNKNOWN" {
    try {
      if (Device.deviceType === Device.DeviceType.PHONE) {
        return "PHONE";
      } else if (Device.deviceType === Device.DeviceType.TABLET) {
        return "TABLET";
      } else if (Device.deviceType === Device.DeviceType.DESKTOP) {
        return "DESKTOP";
      } else if (Device.deviceType === Device.DeviceType.TV) {
        return "TV";
      }
      return "UNKNOWN";
    } catch (error) {
      return "UNKNOWN";
    }
  }

  /**
   * Get device locale
   */
  private static getLocale(): string {
    try {
      // Try to get locale from Intl API (works on most platforms)
      if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        if (locale) return locale;
      }
      return "en-US";
    } catch (error) {
      return "en-US";
    }
  }

  /**
   * Get device timezone
   */
  private static getTimezone(): string {
    try {
      // Get timezone offset in minutes
      const offset = new Date().getTimezoneOffset();
      const hours = Math.abs(Math.floor(offset / 60));
      const minutes = Math.abs(offset % 60);
      const sign = offset <= 0 ? "+" : "-";
      return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } catch (error) {
      return "UTC";
    }
  }

  /**
   * Get minimal context as fallback
   */
  private static getMinimalContext(environment: "dev" | "prod"): EventContext {
    const { width, height } = Dimensions.get("window");
    return {
      app: {
        name: "Unknown",
        version: "0.0.0",
        build: "0",
        namespace: "unknown",
      },
      device: {
        id: null,
        manufacturer: null,
        model: null,
        name: null,
        type: "UNKNOWN",
        brand: null,
      },
      os: {
        name: Platform.OS,
        version: Platform.Version.toString(),
      },
      screen: {
        width,
        height,
        density: 1,
      },
      locale: "en-US",
      timezone: "UTC",
      environment,
    };
  }

  /**
   * Clear cached context (useful for testing or when app info changes)
   */
  static clearCache(): void {
    this.cachedContext = null;
  }
}
