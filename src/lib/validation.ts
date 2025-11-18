/**
 * Validation schemas for API requests
 */

import { z } from 'zod';

// Source type enum
export const SourceTypeSchema = z.enum(['RDB', 'JSON']);

// Generation rule schema
export const GenerationRuleSchema = z.object({
  columnName: z.string(),
  type: z.enum(['string', 'int', 'float', 'boolean', 'date', 'datetime', 'enum', 'uuid', 'email', 'phone', 'json']),
  nullable: z.boolean(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  values: z.array(z.string()).optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  generator: z.enum(['uuid', 'email', 'phone', 'firstName', 'lastName', 'company', 'address', 'city', 'country', 'url', 'lorem']).optional(),
});

export const GenerationRulesSchema = z.record(GenerationRuleSchema);

// Profile schemas
export const CreateProfileSchema = z.object({
  name: z.string().min(1).max(255),
  sourceType: SourceTypeSchema,
  sourceSchemaJson: z.record(z.any()),
  rulesJson: z.record(z.any()),
  rowCount: z.number().int().min(1).max(1000000).default(100),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  rulesJson: z.record(z.any()).optional(),
  rowCount: z.number().int().min(1).max(1000000).optional(),
});

// Run schemas
export const CreateRunSchema = z.object({
  profileId: z.string().uuid(),
  format: z.enum(['csv', 'json']).default('csv'),
  outputDir: z.string().default('./output'),
});

// Query schemas
export const ListRunsQuerySchema = z.object({
  profileId: z.string().uuid().optional(),
});

// ID param schema
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

// Export types
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateRunInput = z.infer<typeof CreateRunSchema>;
export type ListRunsQuery = z.infer<typeof ListRunsQuerySchema>;
export type UuidParam = z.infer<typeof UuidParamSchema>;
