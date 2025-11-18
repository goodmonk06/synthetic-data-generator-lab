/**
 * Service for managing profile snapshots (versioning)
 */

import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { eventBus, DomainEventType } from '../lib/events';

export interface CreateSnapshotInput {
  name?: string;
  comment?: string;
}

/**
 * Create a snapshot of a profile
 */
export async function createSnapshot(profileId: string, input: CreateSnapshotInput) {
  const profile = await prisma.generationProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Get the next version number
  const latestSnapshot = await prisma.profileSnapshot.findFirst({
    where: { profileId },
    orderBy: { version: 'desc' },
  });

  const version = latestSnapshot ? latestSnapshot.version + 1 : 1;

  const snapshot = await prisma.profileSnapshot.create({
    data: {
      profileId,
      version,
      name: input.name || `Version ${version}`,
      comment: input.comment,
      sourceSchemaJson: profile.sourceSchemaJson,
      rulesJson: profile.rulesJson,
      rowCount: profile.rowCount,
    },
  });

  logger.info('Snapshot created', {
    profileId,
    snapshotId: snapshot.id,
    version,
  });

  await eventBus.emit(
    eventBus.createEvent(DomainEventType.PROFILE_SNAPSHOT_CREATED, {
      profileId,
      snapshotId: snapshot.id,
      version,
    })
  );

  return snapshot;
}

/**
 * List snapshots for a profile
 */
export async function listSnapshots(profileId: string) {
  return prisma.profileSnapshot.findMany({
    where: { profileId },
    orderBy: { version: 'desc' },
  });
}

/**
 * Get a specific snapshot
 */
export async function getSnapshot(id: string) {
  return prisma.profileSnapshot.findUnique({
    where: { id },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Restore a profile from a snapshot
 */
export async function restoreFromSnapshot(snapshotId: string) {
  const snapshot = await prisma.profileSnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot) {
    throw new Error('Snapshot not found');
  }

  const profile = await prisma.generationProfile.update({
    where: { id: snapshot.profileId },
    data: {
      sourceSchemaJson: snapshot.sourceSchemaJson,
      rulesJson: snapshot.rulesJson,
      rowCount: snapshot.rowCount,
    },
  });

  logger.info('Profile restored from snapshot', {
    profileId: snapshot.profileId,
    snapshotId,
    version: snapshot.version,
  });

  return profile;
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(id: string) {
  await prisma.profileSnapshot.delete({
    where: { id },
  });

  logger.info('Snapshot deleted', { snapshotId: id });
}

/**
 * Compare two snapshots
 */
export async function compareSnapshots(snapshotId1: string, snapshotId2: string) {
  const [snapshot1, snapshot2] = await Promise.all([
    prisma.profileSnapshot.findUnique({ where: { id: snapshotId1 } }),
    prisma.profileSnapshot.findUnique({ where: { id: snapshotId2 } }),
  ]);

  if (!snapshot1 || !snapshot2) {
    throw new Error('One or both snapshots not found');
  }

  return {
    snapshot1: {
      id: snapshot1.id,
      version: snapshot1.version,
      name: snapshot1.name,
    },
    snapshot2: {
      id: snapshot2.id,
      version: snapshot2.version,
      name: snapshot2.name,
    },
    differences: {
      rowCount: snapshot1.rowCount !== snapshot2.rowCount,
      schema: JSON.stringify(snapshot1.sourceSchemaJson) !== JSON.stringify(snapshot2.sourceSchemaJson),
      rules: JSON.stringify(snapshot1.rulesJson) !== JSON.stringify(snapshot2.rulesJson),
    },
  };
}
