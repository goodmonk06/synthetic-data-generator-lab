/**
 * Generate generation rules from table schema
 */

import { TableSchema, ColumnDefinition, sqlTypeToGenerationType } from './sqlParser';

export interface GenerationRule {
  columnName: string;
  type: 'string' | 'int' | 'float' | 'boolean' | 'date' | 'datetime' | 'enum' | 'uuid' | 'email' | 'phone' | 'json';
  nullable: boolean;

  // String rules
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Number rules
  min?: number;
  max?: number;

  // Enum rules
  values?: string[];

  // Date rules
  minDate?: string;
  maxDate?: string;

  // Special generators
  generator?: 'uuid' | 'email' | 'phone' | 'firstName' | 'lastName' | 'company' | 'address' | 'city' | 'country' | 'url' | 'lorem';
}

export interface GenerationRules {
  [columnName: string]: GenerationRule;
}

/**
 * Infer generation rules from table schema
 */
export function inferRulesFromSchema(schema: TableSchema): GenerationRules {
  const rules: GenerationRules = {};

  for (const column of schema.columns) {
    rules[column.name] = inferRuleFromColumn(column);
  }

  return rules;
}

/**
 * Infer rule for a single column
 */
function inferRuleFromColumn(column: ColumnDefinition): GenerationRule {
  const baseType = sqlTypeToGenerationType(column.type);
  const columnNameLower = column.name.toLowerCase();

  const rule: GenerationRule = {
    columnName: column.name,
    type: baseType as any,
    nullable: column.nullable,
  };

  // Infer special generators based on column name
  if (columnNameLower.includes('email')) {
    rule.type = 'email';
    rule.generator = 'email';
  } else if (columnNameLower.includes('phone') || columnNameLower.includes('mobile')) {
    rule.type = 'phone';
    rule.generator = 'phone';
  } else if (columnNameLower.includes('firstname') || columnNameLower === 'first_name') {
    rule.type = 'string';
    rule.generator = 'firstName';
  } else if (columnNameLower.includes('lastname') || columnNameLower === 'last_name') {
    rule.type = 'string';
    rule.generator = 'lastName';
  } else if (columnNameLower.includes('company')) {
    rule.type = 'string';
    rule.generator = 'company';
  } else if (columnNameLower.includes('address')) {
    rule.type = 'string';
    rule.generator = 'address';
  } else if (columnNameLower.includes('city')) {
    rule.type = 'string';
    rule.generator = 'city';
  } else if (columnNameLower.includes('country')) {
    rule.type = 'string';
    rule.generator = 'country';
  } else if (columnNameLower.includes('url') || columnNameLower.includes('website')) {
    rule.type = 'string';
    rule.generator = 'url';
  } else if (columnNameLower.includes('description') || columnNameLower.includes('bio')) {
    rule.type = 'string';
    rule.generator = 'lorem';
  } else if (column.type.toUpperCase().includes('UUID')) {
    rule.type = 'uuid';
    rule.generator = 'uuid';
  }

  // Set defaults based on type
  if (rule.type === 'string' && !rule.generator) {
    rule.minLength = 1;
    rule.maxLength = extractVarcharLength(column.type) || 255;
  } else if (rule.type === 'int') {
    rule.min = column.primaryKey ? 1 : 0;
    rule.max = 1000000;
  } else if (rule.type === 'float') {
    rule.min = 0;
    rule.max = 1000;
  } else if (rule.type === 'date' || rule.type === 'datetime') {
    const now = new Date();
    const pastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    rule.minDate = pastYear.toISOString().split('T')[0];
    rule.maxDate = now.toISOString().split('T')[0];
  }

  return rule;
}

/**
 * Extract length from VARCHAR(n) type
 */
function extractVarcharLength(type: string): number | null {
  const match = type.match(/\((\d+)\)/);
  return match ? parseInt(match[1]) : null;
}
