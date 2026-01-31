/**
 * Transport layer for sending events to the analytics API
 * Handles batching, retry logic with exponential backoff
 */

import {
  MAX_BATCH_SIZE,
  MAX_EVENTS_PER_BATCH,
  RETRY_CONFIG,
} from "./constants";
import { AnalyticsEvent } from "./types";
import { calculateBackoff, getObjectSize, sleep } from "./utils";

export interface TransportConfig {
  apiKey: string;
  baseUrl: string;
  debug: boolean;
}

export class Transport {
  private config: TransportConfig;
  private logger: any;

  constructor(config: TransportConfig, logger: any) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Send a batch of events to the API
   * Returns the IDs of successfully sent events
   */
  async sendBatch(events: AnalyticsEvent[]): Promise<string[]> {
    if (events.length === 0) return [];

    // Split into smaller batches if needed
    const batches = this.createBatches(events);
    const sentEventIds: string[] = [];

    for (const batch of batches) {
      try {
        const success = await this.sendBatchWithRetry(batch);
        if (success) {
          sentEventIds.push(...batch.map((e) => e.id));
        }
      } catch (error) {
        this.logger.error("Failed to send batch after retries:", error);
        // Continue with next batch even if this one fails
      }
    }

    return sentEventIds;
  }

  /**
   * Send a single batch with retry logic
   */
  private async sendBatchWithRetry(events: AnalyticsEvent[]): Promise<boolean> {
    let attempt = 0;

    while (attempt < RETRY_CONFIG.maxRetries) {
      try {
        const response = await this.makeRequest(events);

        if (response.ok) {
          this.logger.log(`Successfully sent ${events.length} events`);
          return true;
        }

        // Get error details for better debugging
        const errorText = await response.text().catch(() => "Unknown error");
        this.logger.error(`API error ${response.status}:`, errorText);

        // Check if error is retryable
        if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          this.logger.error(`Client error ${response.status}, not retrying`);
          return false;
        }

        // Server error - retry with backoff
        this.logger.warn(`Server error ${response.status}, retrying...`);
      } catch (error) {
        this.logger.warn(`Network error on attempt ${attempt + 1}:`, error);
        if (error instanceof Error) {
          this.logger.warn(`Error details: ${error.message}`);
        }
      }

      // Calculate backoff delay
      if (attempt < RETRY_CONFIG.maxRetries - 1) {
        const delay = calculateBackoff(
          attempt,
          RETRY_CONFIG.initialDelay,
          RETRY_CONFIG.maxDelay,
          RETRY_CONFIG.backoffMultiplier
        );
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }

      attempt++;
    }

    return false;
  }

  /**
   * Make HTTP request to the API
   */
  private async makeRequest(events: AnalyticsEvent[]): Promise<Response> {
    const url = `${this.config.baseUrl}/api/events`;
    this.logger.log(`Sending ${events.length} events to ${url}`);

    try {
      const requestBody = {
        events,
        sentAt: new Date().toISOString(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        this.logger.error(
          `API request failed: ${response.status} ${response.statusText}`,
          errorText
        );
      } else {
        this.logger.log(`API request successful: ${response.status}`);
      }

      return response;
    } catch (error) {
      this.logger.error("Network error sending events:", error);
      throw error;
    }
  }

  /**
   * Split events into batches based on size and count limits
   */
  private createBatches(events: AnalyticsEvent[]): AnalyticsEvent[][] {
    const batches: AnalyticsEvent[][] = [];
    let currentBatch: AnalyticsEvent[] = [];
    let currentBatchSize = 0;

    for (const event of events) {
      const eventSize = getObjectSize(event);

      // Check if adding this event would exceed limits
      if (
        currentBatch.length >= MAX_EVENTS_PER_BATCH ||
        currentBatchSize + eventSize > MAX_BATCH_SIZE
      ) {
        // Start new batch
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = [event];
        currentBatchSize = eventSize;
      } else {
        // Add to current batch
        currentBatch.push(event);
        currentBatchSize += eventSize;
      }
    }

    // Add final batch
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Update base URL - disabled, always uses production server
   * This method is kept for backward compatibility but does nothing
   */
  updateBaseUrl(_baseUrl: string): void {
    // baseUrl is not configurable - always uses production server
    // This method is kept for backward compatibility but does nothing
  }
}
