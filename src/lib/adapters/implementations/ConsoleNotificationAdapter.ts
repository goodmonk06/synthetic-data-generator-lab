/**
 * Console notification adapter (for development/testing)
 */

import { INotificationAdapter, NotificationPayload } from '../INotificationAdapter';
import { logger } from '../../logger';

export class ConsoleNotificationAdapter implements INotificationAdapter {
  getName(): string {
    return 'console';
  }

  isConfigured(): boolean {
    return true; // Always available
  }

  async send(payload: NotificationPayload): Promise<void> {
    logger.info(`[NOTIFICATION] ${payload.title}`, {
      type: payload.type,
      message: payload.message,
      data: payload.data,
    });
  }
}
