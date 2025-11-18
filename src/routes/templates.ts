/**
 * API routes for templates
 */

import { FastifyInstance } from 'fastify';
import {
  createTemplate,
  listTemplates,
  getTemplate,
  instantiateTemplate,
  deleteTemplate,
} from '../services/templateService';
import { CreateProfileSchema, UuidParamSchema } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { z } from 'zod';

const InstantiateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  params: z.record(z.any()).optional(),
  rowCount: z.number().int().min(1).optional(),
});

export async function templateRoutes(fastify: FastifyInstance) {
  // GET /api/templates
  fastify.get('/api/templates', async () => {
    const templates = await listTemplates();
    return { templates };
  });

  // GET /api/templates/:id
  fastify.get<{ Params: { id: string } }>('/api/templates/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const template = await getTemplate(id);

    if (!template) {
      throw new NotFoundError('Template', id);
    }

    return { template };
  });

  // POST /api/templates
  fastify.post('/api/templates', async (request, reply) => {
    const data = CreateProfileSchema.parse(request.body);
    const template = await createTemplate(data);
    return reply.status(201).send({ template });
  });

  // POST /api/templates/:id/instantiate
  fastify.post<{ Params: { id: string } }>(
    '/api/templates/:id/instantiate',
    async (request, reply) => {
      const { id } = UuidParamSchema.parse({ id: request.params.id });
      const data = InstantiateTemplateSchema.parse(request.body);

      const profile = await instantiateTemplate(id, data);
      return reply.status(201).send({ profile });
    }
  );

  // DELETE /api/templates/:id
  fastify.delete<{ Params: { id: string } }>('/api/templates/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    await deleteTemplate(id);
    return reply.status(204).send();
  });
}
