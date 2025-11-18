/**
 * API routes for generation runs
 */

import { FastifyInstance } from 'fastify';
import { executeRun, getRun, listRuns } from '../services/runService';
import { getProfile } from '../services/profileService';
import {
  CreateRunSchema,
  ListRunsQuerySchema,
  UuidParamSchema,
} from '../lib/validation';
import { NotFoundError } from '../lib/errors';

export async function runRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/runs
   * List all runs
   */
  fastify.get('/api/runs', async (request, reply) => {
    const query = ListRunsQuerySchema.parse(request.query);
    const runs = await listRuns(query.profileId);
    return { runs };
  });

  /**
   * GET /api/runs/:id
   * Get a specific run
   */
  fastify.get<{ Params: { id: string } }>('/api/runs/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const run = await getRun(id);

    if (!run) {
      throw new NotFoundError('Run', id);
    }

    return { run };
  });

  /**
   * POST /api/runs
   * Execute a new generation run
   */
  fastify.post('/api/runs', async (request, reply) => {
    const data = CreateRunSchema.parse(request.body);

    // Verify profile exists
    const profile = await getProfile(data.profileId);
    if (!profile) {
      throw new NotFoundError('Profile', data.profileId);
    }

    const run = await executeRun(data.profileId, data.format, data.outputDir);

    return reply.status(201).send({ run });
  });
}
