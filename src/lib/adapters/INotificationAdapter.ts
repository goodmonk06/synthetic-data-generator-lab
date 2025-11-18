/**
 * Notification adapter interface
 * Allows sending notifications through different channels
 */

export enum NotificationType {
  RUN_COMPLETED = 'run.completed',
  RUN_FAILED = 'run.failed',
  SCHEDULE_EXECUTED = 'schedule.executed',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export interface INotificationAdapter {
  /**
   * Send a notification
   */
  send(payload: NotificationPayload): Promise<void>;

  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Check if adapter is configured
   */
  isConfigured(): boolean;
}
