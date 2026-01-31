/**
 * Event queue manager
 * Handles queuing, batching, and flushing events
 */

import { AnalyticsEvent } from './types';
import { Storage } from './storage';
import { Transport } from './transport';

export interface QueueConfig {
  maxQueueSize: number;
  flushInterval: number;
}

export class EventQueue {
  private config: QueueConfig;
  private transport: Transport;
  private logger: any;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(config: QueueConfig, transport: Transport, logger: any) {
    this.config = config;
    this.transport = transport;
    this.logger = logger;
  }

  /**
   * Initialize the queue
   * Starts the flush timer and attempts to flush any persisted events
   */
  async initialize(): Promise<void> {
    // Start periodic flush
    this.startFlushTimer();

    // Try to flush any events that were persisted from previous session
    await this.flush();
  }

  /**
   * Add event to queue
   */
  async enqueue(event: AnalyticsEvent): Promise<void> {
    try {
      // Add to persistent storage
      await Storage.addEventToQueue(event);
      this.logger.log(`Event queued: ${event.name}`);

      // Check if we should flush
      const queuedEvents = await Storage.getQueuedEvents();
      this.logger.log(`Current queue size: ${queuedEvents.length}/${this.config.maxQueueSize}`);
      
      if (queuedEvents.length >= this.config.maxQueueSize) {
        this.logger.log('Queue size limit reached, flushing...');
        await this.flush();
      }
    } catch (error) {
      this.logger.error('Failed to enqueue event:', error);
    }
  }

  /**
   * Flush all queued events
   */
  async flush(): Promise<void> {
    // Prevent concurrent flushes
    if (this.isFlushing) {
      this.logger.log('Flush already in progress, skipping');
      return;
    }

    this.isFlushing = true;

    try {
      const events = await Storage.getQueuedEvents();

      if (events.length === 0) {
        this.logger.log('No events to flush');
        return;
      }

      this.logger.log(`Flushing ${events.length} events...`);

      // Send events via transport
      const sentEventIds = await this.transport.sendBatch(events);

      // Remove successfully sent events from queue
      if (sentEventIds.length > 0) {
        await Storage.removeEventsFromQueue(sentEventIds);
        this.logger.log(`Successfully flushed ${sentEventIds.length} events`);
      }

      // Check if there are failed events remaining
      const remainingEvents = await Storage.getQueuedEvents();
      if (remainingEvents.length > 0) {
        this.logger.warn(`${remainingEvents.length} events failed to send, will retry later`);
      }
    } catch (error) {
      this.logger.error('Error during flush:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        this.logger.error('Error in periodic flush:', error);
      });
    }, this.config.flushInterval);

    this.logger.log(`Started flush timer with interval: ${this.config.flushInterval}ms`);
  }

  /**
   * Stop periodic flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
      this.logger.log('Stopped flush timer');
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      const events = await Storage.getQueuedEvents();
      return events.length;
    } catch (error) {
      this.logger.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Clear all queued events
   */
  async clear(): Promise<void> {
    try {
      await Storage.clearQueue();
      this.logger.log('Queue cleared');
    } catch (error) {
      this.logger.error('Failed to clear queue:', error);
    }
  }

  /**
   * Shutdown the queue
   * Flushes remaining events and stops timer
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down event queue...');
    this.stopFlushTimer();
    await this.flush();
  }
}

