/**
 * Service for managing generation profiles
 */

import { prisma } from '../lib/db';
import { SourceType } from '@prisma/client';
import { TableSchema } from '../lib/sqlParser';
import { GenerationRules } from '../lib/ruleGenerator';

export interface CreateProfileInput {
  name: string;
  sourceType: SourceType;
  sourceSchemaJson: TableSchema | object;
  rulesJson: GenerationRules | object;
  rowCount?: number;
}

export interface UpdateProfileInput {
  name?: string;
  rulesJson?: GenerationRules | object;
  rowCount?: number;
}

/**
 * Create a new generation profile
 */
export async function createProfile(input: CreateProfileInput) {
  return prisma.generationProfile.create({
    data: {
      name: input.name,
      sourceType: input.sourceType,
      sourceSchemaJson: input.sourceSchemaJson as any,
      rulesJson: input.rulesJson as any,
      rowCount: input.rowCount || 100,
    },
  });
}

/**
 * Get a profile by ID
 */
export async function getProfile(id: string) {
  return prisma.generationProfile.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * List all profiles
 */
export async function listProfiles() {
  return prisma.generationProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { runs: true },
      },
    },
  });
}

/**
 * Update a profile
 */
export async function updateProfile(id: string, input: UpdateProfileInput) {
  return prisma.generationProfile.update({
    where: { id },
    data: input as any,
  });
}

/**
 * Delete a profile
 */
export async function deleteProfile(id: string) {
  return prisma.generationProfile.delete({
    where: { id },
  });
}
