/**
 * API routes for schedules
 */

import { FastifyInstance } from 'fastify';
import {
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/scheduleService';
import { UuidParamSchema } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { z } from 'zod';

const CreateScheduleSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  cronExpr: z.string().min(1),
  outputFormat: z.enum(['csv', 'json']).default('csv'),
  outputDir: z.string().default('./output'),
});

const UpdateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cronExpr: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  outputFormat: z.enum(['csv', 'json']).optional(),
  outputDir: z.string().optional(),
});

export async function scheduleRoutes(fastify: FastifyInstance) {
  // GET /api/schedules
  fastify.get<{
    Querystring: { profileId?: string };
  }>('/api/schedules', async (request) => {
    const { profileId } = request.query;
    const schedules = await listSchedules(profileId);
    return { schedules };
  });

  // GET /api/schedules/:id
  fastify.get<{ Params: { id: string } }>('/api/schedules/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const schedule = await getSchedule(id);

    if (!schedule) {
      throw new NotFoundError('Schedule', id);
    }

    return { schedule };
  });

  // POST /api/schedules
  fastify.post('/api/schedules', async (request, reply) => {
    const data = CreateScheduleSchema.parse(request.body);
    const schedule = await createSchedule(data);
    return reply.status(201).send({ schedule });
  });

  // PUT /api/schedules/:id
  fastify.put<{ Params: { id: string } }>('/api/schedules/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    const data = UpdateScheduleSchema.parse(request.body);
    const schedule = await updateSchedule(id, data);
    return { schedule };
  });

  // DELETE /api/schedules/:id
  fastify.delete<{ Params: { id: string } }>('/api/schedules/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse({ id: request.params.id });
    await deleteSchedule(id);
    return reply.status(204).send();
  });
}
