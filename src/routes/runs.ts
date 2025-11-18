/**
 * API routes for generation runs
 */

import { FastifyInstance } from 'fastify';
import { executeRun, getRun, listRuns } from '../services/runService';

export async function runRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/runs
   * List all runs
   */
  fastify.get<{
    Querystring: {
      profileId?: string;
    };
  }>('/api/runs', async (request, reply) => {
    try {
      const runs = await listRuns(request.query.profileId);
      return { runs };
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to list runs',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/runs/:id
   * Get a specific run
   */
  fastify.get<{ Params: { id: string } }>('/api/runs/:id', async (request, reply) => {
    try {
      const run = await getRun(request.params.id);

      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      return { run };
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to get run',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/runs
   * Execute a new generation run
   */
  fastify.post<{
    Body: {
      profileId: string;
      format?: 'csv' | 'json';
      outputDir?: string;
    };
  }>('/api/runs', async (request, reply) => {
    try {
      const { profileId, format = 'csv', outputDir = './output' } = request.body;

      const run = await executeRun(profileId, format, outputDir);

      return reply.status(201).send({ run });
    } catch (error) {
      reply.status(500).send({
        error: 'Failed to execute run',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
