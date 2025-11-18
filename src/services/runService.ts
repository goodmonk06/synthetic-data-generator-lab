/**
 * Service for managing generation runs
 */

import { prisma } from '../lib/db';
import { RunStatus } from '@prisma/client';
import { DataGenerator } from '../lib/dataGenerator';
import { writeOutput, OutputFormat } from '../lib/outputWriter';
import { GenerationRules } from '../lib/ruleGenerator';
import * as path from 'path';

/**
 * Execute a generation run
 */
export async function executeRun(
  profileId: string,
  format: OutputFormat = 'csv',
  outputDir: string = './output'
) {
  // Get profile
  const profile = await prisma.generationProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error(`Profile ${profileId} not found`);
  }

  // Create run record
  const run = await prisma.generationRun.create({
    data: {
      profileId,
      status: RunStatus.RUNNING,
    },
  });

  try {
    // Generate data
    const generator = new DataGenerator();
    const rules = profile.rulesJson as unknown as GenerationRules;
    const data = generator.generateRows(rules, profile.rowCount);

    // Write output
    const outputPath = await writeOutput(
      data,
      format,
      outputDir,
      profile.name.replace(/\s+/g, '_').toLowerCase()
    );

    // Update run as completed
    return await prisma.generationRun.update({
      where: { id: run.id },
      data: {
        status: RunStatus.COMPLETED,
        finishedAt: new Date(),
        outputPath,
        rowsGenerated: data.length,
      },
    });
  } catch (error) {
    // Update run as failed
    await prisma.generationRun.update({
      where: { id: run.id },
      data: {
        status: RunStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * Get a run by ID
 */
export async function getRun(id: string) {
  return prisma.generationRun.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });
}

/**
 * List all runs
 */
export async function listRuns(profileId?: string) {
  return prisma.generationRun.findMany({
    where: profileId ? { profileId } : undefined,
    orderBy: { startedAt: 'desc' },
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
