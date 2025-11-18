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
import { SourceType } from '@prisma/client';

export async function profileRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/profiles
   * List all profiles
   */
  fastify.get('/api/profiles', async (request, reply) => {
    try {
      const profiles = await listProfiles();
      return { profiles };
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to list profiles',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/profiles/:id
   * Get a specific profile
   */
  fastify.get<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    try {
      const profile = await getProfile(request.params.id);

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      return { profile };
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to get profile',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/profiles
   * Create a new profile
   */
  fastify.post<{
    Body: {
      name: string;
      sourceType: SourceType;
      sourceSchemaJson: object;
      rulesJson: object;
      rowCount?: number;
    };
  }>('/api/profiles', async (request, reply) => {
    try {
      const profile = await createProfile(request.body);
      return reply.status(201).send({ profile });
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to create profile',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * PUT /api/profiles/:id
   * Update a profile
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      rulesJson?: object;
      rowCount?: number;
    };
  }>('/api/profiles/:id', async (request, reply) => {
    try {
      const profile = await updateProfile(request.params.id, request.body);
      return { profile };
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * DELETE /api/profiles/:id
   * Delete a profile
   */
  fastify.delete<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    try {
      await deleteProfile(request.params.id);
      return reply.status(204).send();
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to delete profile',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
