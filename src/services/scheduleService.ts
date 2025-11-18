/**
 * Service for managing schedules
 */

import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { eventBus, DomainEventType } from '../lib/events';
import { metrics, MetricNames } from '../lib/metrics';
import { parseExpression } from 'cron-parser';

export interface CreateScheduleInput {
  profileId: string;
  name: string;
  description?: string;
  cronExpr: string;
  outputFormat?: string;
  outputDir?: string;
}

export interface UpdateScheduleInput {
  name?: string;
  description?: string;
  cronExpr?: string;
  enabled?: boolean;
  outputFormat?: string;
  outputDir?: string;
}

/**
 * Create a schedule
 */
export async function createSchedule(input: CreateScheduleInput) {
  // Validate cron expression
  try {
    const interval = parseExpression(input.cronExpr);
    const nextRun = interval.next().toDate();

    const schedule = await prisma.schedule.create({
      data: {
        ...input,
        nextRunAt: nextRun,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info('Schedule created', { scheduleId: schedule.id, name: schedule.name });
    metrics.incrementCounter(MetricNames.SCHEDULE_CREATED, { profileId: input.profileId });

    await eventBus.emit(
      eventBus.createEvent(DomainEventType.SCHEDULE_CREATED, {
        scheduleId: schedule.id,
        profileId: input.profileId,
        cronExpr: input.cronExpr,
      })
    );

    return schedule;
  } catch (error) {
    throw new Error(`Invalid cron expression: ${input.cronExpr}`);
  }
}

/**
 * List schedules
 */
export async function listSchedules(profileId?: string) {
  return prisma.schedule.findMany({
    where: profileId ? { profileId } : undefined,
    include: {
      profile: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          runs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get schedule by ID
 */
export async function getSchedule(id: string) {
  return prisma.schedule.findUnique({
    where: { id },
    include: {
      profile: true,
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Update schedule
 */
export async function updateSchedule(id: string, input: UpdateScheduleInput) {
  const data: any = { ...input };

  // If cron expression changed, calculate next run
  if (input.cronExpr) {
    try {
      const interval = parseExpression(input.cronExpr);
      data.nextRunAt = interval.next().toDate();
    } catch (error) {
      throw new Error(`Invalid cron expression: ${input.cronExpr}`);
    }
  }

  const schedule = await prisma.schedule.update({
    where: { id },
    data,
  });

  logger.info('Schedule updated', { scheduleId: id });

  if (input.enabled !== undefined) {
    const eventType = input.enabled
      ? DomainEventType.SCHEDULE_ENABLED
      : DomainEventType.SCHEDULE_DISABLED;

    await eventBus.emit(
      eventBus.createEvent(eventType, { scheduleId: id })
    );
  }

  return schedule;
}

/**
 * Delete schedule
 */
export async function deleteSchedule(id: string) {
  await prisma.schedule.delete({
    where: { id },
  });

  logger.info('Schedule deleted', { scheduleId: id });
}

/**
 * Get schedules that are due to run
 */
export async function getDueSchedules(): Promise<any[]> {
  const now = new Date();

  return prisma.schedule.findMany({
    where: {
      enabled: true,
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      profile: true,
    },
  });
}

/**
 * Update schedule after run
 */
export async function updateScheduleAfterRun(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    return;
  }

  // Calculate next run time
  try {
    const interval = parseExpression(schedule.cronExpr);
    const nextRun = interval.next().toDate();

    await prisma.schedule.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun,
        runCount: { increment: 1 },
      },
    });

    logger.debug('Schedule updated after run', { scheduleId: id, nextRun });
  } catch (error) {
    logger.error('Failed to calculate next run time', error, { scheduleId: id });
  }
}
