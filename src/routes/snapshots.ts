/**
 * API routes for profile snapshots
 */

import { FastifyInstance } from 'fastify';
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  restoreFromSnapshot,
  deleteSnapshot,
  compareSnapshots,
} from '../services/snapshotService';
import { UuidParamSchema } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { z } from 'zod';

const CreateSnapshotSchema = z.object({
  name: z.string().optional(),
  comment: z.string().optional(),
});

export async function snapshotRoutes(fastify: FastifyInstance) {
  // GET /api/profiles/:profileId/snapshots
  fastify.get<{ Params: { profileId: string } }>(
    '/api/profiles/:profileId/snapshots',
    async (request) => {
      const profileId = request.params.profileId;
      const snapshots = await listSnapshots(profileId);
      return { snapshots };
    }
  );

  // POST /api/profiles/:profileId/snapshots
  fastify.post<{ Params: { profileId: string } }>(
    '/api/profiles/:profileId/snapshots',
    async (request, reply) => {
      const profileId = request.params.profileId;
      const data = CreateSnapshotSchema.parse(request.body);
      const snapshot = await createSnapshot(profileId, data);
      return reply.status(201).send({ snapshot });
    }
  );

  // GET /api/snapshots/:id
  fastify.get<{ Params: { id: string } }>('/api/snapshots/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const snapshot = await getSnapshot(id);

    if (!snapshot) {
      throw new NotFoundError('Snapshot', id);
    }

    return { snapshot };
  });

  // POST /api/snapshots/:id/restore
  fastify.post<{ Params: { id: string } }>('/api/snapshots/:id/restore', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const profile = await restoreFromSnapshot(id);
    return { profile };
  });

  // DELETE /api/snapshots/:id
  fastify.delete<{ Params: { id: string } }>('/api/snapshots/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    await deleteSnapshot(id);
    return reply.status(204).send();
  });

  // GET /api/snapshots/compare?snapshot1=:id1&snapshot2=:id2
  fastify.get<{
    Querystring: { snapshot1: string; snapshot2: string };
  }>('/api/snapshots/compare', async (request) => {
    const { snapshot1, snapshot2 } = request.query;
    const comparison = await compareSnapshots(snapshot1, snapshot2);
    return { comparison };
  });
}
