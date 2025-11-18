/**
 * API routes for webhooks
 */

import { FastifyInstance } from 'fastify';
import {
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
} from '../services/webhookService';
import { UuidParamSchema } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { z } from 'zod';

const CreateWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  enabled: z.boolean().default(true),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).max(5).default(3),
});

const UpdateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  enabled: z.boolean().optional(),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).max(5).optional(),
});

export async function webhookRoutes(fastify: FastifyInstance) {
  // GET /api/webhooks
  fastify.get('/api/webhooks', async () => {
    const webhooks = await listWebhooks();
    return { webhooks };
  });

  // GET /api/webhooks/:id
  fastify.get<{ Params: { id: string } }>('/api/webhooks/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const webhook = await getWebhook(id);

    if (!webhook) {
      throw new NotFoundError('Webhook', id);
    }

    return { webhook };
  });

  // POST /api/webhooks
  fastify.post('/api/webhooks', async (request, reply) => {
    const data = CreateWebhookSchema.parse(request.body);
    const webhook = await createWebhook(data);
    return reply.status(201).send({ webhook });
  });

  // PUT /api/webhooks/:id
  fastify.put<{ Params: { id: string } }>('/api/webhooks/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const data = UpdateWebhookSchema.parse(request.body);
    const webhook = await updateWebhook(id, data);
    return { webhook };
  });

  // DELETE /api/webhooks/:id
  fastify.delete<{ Params: { id: string } }>('/api/webhooks/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    await deleteWebhook(id);
    return reply.status(204).send();
  });
}
