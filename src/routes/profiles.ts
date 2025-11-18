/**
 * API routes for generation profiles
 */

import { FastifyInstance } from 'fastify';
import {
  createProfile,
  getProfile,
  listProfiles,
  updateProfile,
  deleteProfile,
} from '../services/profileService';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  UuidParamSchema,
} from '../lib/validation';
import { NotFoundError } from '../lib/errors';

export async function profileRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/profiles
   * List all profiles
   */
  fastify.get('/api/profiles', async (request, reply) => {
    const profiles = await listProfiles();
    return { profiles };
  });

  /**
   * GET /api/profiles/:id
   * Get a specific profile
   */
  fastify.get<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const profile = await getProfile(id);

    if (!profile) {
      throw new NotFoundError('Profile', id);
    }

    return { profile };
  });

  /**
   * POST /api/profiles
   * Create a new profile
   */
  fastify.post('/api/profiles', async (request, reply) => {
    const data = CreateProfileSchema.parse(request.body);
    const profile = await createProfile(data);
    return reply.status(201).send({ profile });
  });

  /**
   * PUT /api/profiles/:id
   * Update a profile
   */
  fastify.put<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const data = UpdateProfileSchema.parse(request.body);

    // Check if profile exists
    const existing = await getProfile(id);
    if (!existing) {
      throw new NotFoundError('Profile', id);
    }

    const profile = await updateProfile(id, data);
    return { profile };
  });

  /**
   * DELETE /api/profiles/:id
   * Delete a profile
   */
  fastify.delete<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });

    // Check if profile exists
    const existing = await getProfile(id);
    if (!existing) {
      throw new NotFoundError('Profile', id);
    }

    await deleteProfile(id);
    return reply.status(204).send();
  });
}
