/**
 * Service for managing templates
 */

import { prisma } from '../lib/db';
import { SourceType } from '@prisma/client';
import { logger } from '../lib/logger';
import { eventBus, DomainEventType } from '../lib/events';
import { metrics, MetricNames } from '../lib/metrics';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  sourceType: SourceType;
  sourceSchemaJson: object;
  rulesJson: object;
  rowCount?: number;
  templateParams?: object;
}

export interface InstantiateTemplateInput {
  name: string;
  description?: string;
  params?: Record<string, any>;
  rowCount?: number;
}

/**
 * Create a template
 */
export async function createTemplate(input: CreateTemplateInput) {
  const template = await prisma.generationProfile.create({
    data: {
      ...input,
      isTemplate: true,
      sourceSchemaJson: input.sourceSchemaJson as any,
      rulesJson: input.rulesJson as any,
      templateParams: input.templateParams as any,
    },
  });

  logger.info('Template created', { templateId: template.id, name: template.name });
  metrics.incrementCounter(MetricNames.TEMPLATE_INSTANTIATED, { templateId: template.id });

  await eventBus.emit(
    eventBus.createEvent(DomainEventType.TEMPLATE_CREATED, {
      templateId: template.id,
      name: template.name,
    })
  );

  return template;
}

/**
 * List all templates
 */
export async function listTemplates() {
  return prisma.generationProfile.findMany({
    where: { isTemplate: true },
    include: {
      _count: {
        select: {
          childProfiles: true,
          runs: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string) {
  return prisma.generationProfile.findUnique({
    where: { id, isTemplate: true },
    include: {
      childProfiles: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

/**
 * Instantiate a profile from a template
 */
export async function instantiateTemplate(templateId: string, input: InstantiateTemplateInput) {
  const template = await prisma.generationProfile.findUnique({
    where: { id: templateId, isTemplate: true },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Merge template params with instance params
  const templateParams = (template.templateParams as Record<string, any>) || {};
  const instanceParams = input.params || {};
  const mergedParams = { ...templateParams, ...instanceParams };

  // Apply parameters to rules if needed
  const rulesJson = this.applyParamsToRules(
    template.rulesJson as any,
    mergedParams
  );

  const profile = await prisma.generationProfile.create({
    data: {
      name: input.name,
      description: input.description,
      sourceType: template.sourceType,
      sourceSchemaJson: template.sourceSchemaJson,
      rulesJson,
      rowCount: input.rowCount || template.rowCount,
      parentTemplateId: templateId,
      isTemplate: false,
    },
  });

  logger.info('Template instantiated', {
    templateId,
    profileId: profile.id,
    name: profile.name,
  });

  metrics.incrementCounter(MetricNames.TEMPLATE_INSTANTIATED, { templateId });

  await eventBus.emit(
    eventBus.createEvent(DomainEventType.TEMPLATE_INSTANTIATED, {
      templateId,
      profileId: profile.id,
      params: mergedParams,
    })
  );

  return profile;
}

/**
 * Apply parameter values to rules
 */
function applyParamsToRules(
  rules: Record<string, any>,
  params: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, rule] of Object.entries(rules)) {
    result[key] = { ...rule };

    // Replace parameter placeholders in rule values
    for (const [paramKey, paramValue] of Object.entries(params)) {
      const placeholder = `{{${paramKey}}}`;

      // Check numeric fields
      if (typeof rule.min === 'string' && rule.min === placeholder) {
        result[key].min = paramValue;
      }
      if (typeof rule.max === 'string' && rule.max === placeholder) {
        result[key].max = paramValue;
      }

      // Check string fields
      if (typeof rule.minLength === 'string' && rule.minLength === placeholder) {
        result[key].minLength = paramValue;
      }
      if (typeof rule.maxLength === 'string' && rule.maxLength === placeholder) {
        result[key].maxLength = paramValue;
      }

      // Check date fields
      if (typeof rule.minDate === 'string' && rule.minDate === placeholder) {
        result[key].minDate = paramValue;
      }
      if (typeof rule.maxDate === 'string' && rule.maxDate === placeholder) {
        result[key].maxDate = paramValue;
      }

      // Check enum values
      if (Array.isArray(rule.values)) {
        result[key].values = rule.values.map((v: any) =>
          v === placeholder ? paramValue : v
        );
      }
    }
  }

  return result;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
  await prisma.generationProfile.delete({
    where: { id, isTemplate: true },
  });

  logger.info('Template deleted', { templateId: id });
}
