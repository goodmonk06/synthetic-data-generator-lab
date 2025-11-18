/**
 * Service for managing tags
 */

import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
}

/**
 * Create a tag
 */
export async function createTag(input: CreateTagInput) {
  const tag = await prisma.tag.create({
    data: input,
  });

  logger.info('Tag created', { tagId: tag.id, name: tag.name });
  return tag;
}

/**
 * List all tags
 */
export async function listTags() {
  return prisma.tag.findMany({
    include: {
      _count: {
        select: {
          profiles: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get tag by ID
 */
export async function getTag(id: string) {
  return prisma.tag.findUnique({
    where: { id },
    include: {
      profiles: {
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Update tag
 */
export async function updateTag(id: string, input: UpdateTagInput) {
  const tag = await prisma.tag.update({
    where: { id },
    data: input,
  });

  logger.info('Tag updated', { tagId: id });
  return tag;
}

/**
 * Delete tag
 */
export async function deleteTag(id: string) {
  await prisma.tag.delete({
    where: { id },
  });

  logger.info('Tag deleted', { tagId: id });
}

/**
 * Add tag to profile
 */
export async function addTagToProfile(profileId: string, tagId: string) {
  await prisma.profileTag.create({
    data: {
      profileId,
      tagId,
    },
  });

  logger.info('Tag added to profile', { profileId, tagId });
}

/**
 * Remove tag from profile
 */
export async function removeTagFromProfile(profileId: string, tagId: string) {
  await prisma.profileTag.delete({
    where: {
      profileId_tagId: {
        profileId,
        tagId,
      },
    },
  });

  logger.info('Tag removed from profile', { profileId, tagId });
}

/**
 * Get profiles by tag
 */
export async function getProfilesByTag(tagId: string) {
  const profileTags = await prisma.profileTag.findMany({
    where: { tagId },
    include: {
      profile: true,
    },
  });

  return profileTags.map(pt => pt.profile);
}
