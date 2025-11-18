/**
 * Service for managing webhooks
 */

import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import crypto from 'crypto';

export interface CreateWebhookInput {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
  secret?: string;
  headers?: object;
  retryCount?: number;
}

export interface UpdateWebhookInput {
  name?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
  headers?: object;
  retryCount?: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Create a webhook
 */
export async function createWebhook(input: CreateWebhookInput) {
  const webhook = await prisma.webhook.create({
    data: {
      ...input,
      headers: input.headers as any,
    },
  });

  logger.info('Webhook created', { webhookId: webhook.id, name: webhook.name });
  return webhook;
}

/**
 * List all webhooks
 */
export async function listWebhooks() {
  return prisma.webhook.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get webhook by ID
 */
export async function getWebhook(id: string) {
  return prisma.webhook.findUnique({
    where: { id },
  });
}

/**
 * Update webhook
 */
export async function updateWebhook(id: string, input: UpdateWebhookInput) {
  const data: any = { ...input };
  if (input.headers) {
    data.headers = input.headers;
  }

  const webhook = await prisma.webhook.update({
    where: { id },
    data,
  });

  logger.info('Webhook updated', { webhookId: id });
  return webhook;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(id: string) {
  await prisma.webhook.delete({
    where: { id },
  });

  logger.info('Webhook deleted', { webhookId: id });
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(eventName: string, data: any): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      enabled: true,
      events: {
        has: eventName,
      },
    },
  });

  logger.debug('Triggering webhooks', {
    event: eventName,
    webhookCount: webhooks.length,
  });

  await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, eventName, data))
  );
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(webhook: any, eventName: string, data: any): Promise<void> {
  const payload: WebhookPayload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    data,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'SyntheticDataGenerator/1.0',
    ...(webhook.headers || {}),
  };

  // Add signature if secret is configured
  if (webhook.secret) {
    const signature = generateSignature(payload, webhook.secret);
    headers['X-Webhook-Signature'] = signature;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= webhook.retryCount; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.debug('Webhook delivered successfully', {
          webhookId: webhook.id,
          event: eventName,
          attempt,
        });
        return;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }

    // Wait before retry (exponential backoff)
    if (attempt < webhook.retryCount) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  logger.error('Webhook delivery failed', lastError, {
    webhookId: webhook.id,
    event: eventName,
    attempts: webhook.retryCount + 1,
  });
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}
