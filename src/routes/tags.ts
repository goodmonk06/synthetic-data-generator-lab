/**
 * API routes for tags
 */

import { FastifyInstance } from 'fastify';
import {
  createTag,
  listTags,
  getTag,
  updateTag,
  deleteTag,
  addTagToProfile,
  removeTagFromProfile,
} from '../services/tagService';
import { UuidParamSchema } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { z } from 'zod';

const CreateTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
});

const UpdateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export async function tagRoutes(fastify: FastifyInstance) {
  // GET /api/tags
  fastify.get('/api/tags', async () => {
    const tags = await listTags();
    return { tags };
  });

  // GET /api/tags/:id
  fastify.get<{ Params: { id: string } }>('/api/tags/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const tag = await getTag(id);

    if (!tag) {
      throw new NotFoundError('Tag', id);
    }

    return { tag };
  });

  // POST /api/tags
  fastify.post('/api/tags', async (request, reply) => {
    const data = CreateTagSchema.parse(request.body);
    const tag = await createTag(data);
    return reply.status(201).send({ tag });
  });

  // PUT /api/tags/:id
  fastify.put<{ Params: { id: string } }>('/api/tags/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const data = UpdateTagSchema.parse(request.body);
    const tag = await updateTag(id, data);
    return { tag };
  });

  // DELETE /api/tags/:id
  fastify.delete<{ Params: { id: string } }>('/api/tags/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    await deleteTag(id);
    return reply.status(204).send();
  });

  // POST /api/profiles/:profileId/tags/:tagId
  fastify.post<{ Params: { profileId: string; tagId: string } }>(
    '/api/profiles/:profileId/tags/:tagId',
    async (request, reply) => {
      const profileId = request.params.profileId;
      const tagId = request.params.tagId;
      await addTagToProfile(profileId, tagId);
      return reply.status(201).send({ success: true });
    }
  );

  // DELETE /api/profiles/:profileId/tags/:tagId
  fastify.delete<{ Params: { profileId: string; tagId: string } }>(
    '/api/profiles/:profileId/tags/:tagId',
    async (request, reply) => {
      const profileId = request.params.profileId;
      const tagId = request.params.tagId;
      await removeTagFromProfile(profileId, tagId);
      return reply.status(204).send();
    }
  );
}
