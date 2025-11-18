/**
 * Tests for data generator
 */

import { describe, it, expect } from 'vitest';
import { DataGenerator } from '../dataGenerator';
import { GenerationRules } from '../ruleGenerator';

describe('DataGenerator', () => {
  const generator = new DataGenerator();

  it('should generate the correct number of rows', () => {
    const rules: GenerationRules = {
      id: {
        columnName: 'id',
        type: 'int',
        nullable: false,
        min: 1,
        max: 1000,
      },
      name: {
        columnName: 'name',
        type: 'string',
        nullable: false,
        minLength: 5,
        maxLength: 50,
      },
    };

    const rows = generator.generateRows(rules, 10);
    expect(rows).toHaveLength(10);
  });

  it('should generate data matching the rules', () => {
    const rules: GenerationRules = {
      email: {
        columnName: 'email',
        type: 'email',
        nullable: false,
        generator: 'email',
      },
      age: {
        columnName: 'age',
        type: 'int',
        nullable: false,
        min: 18,
        max: 100,
      },
      isActive: {
        columnName: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    };

    const rows = generator.generateRows(rules, 5);

    rows.forEach(row => {
      // Email should be a string containing @
      expect(row.email).toContain('@');

      // Age should be within range
      expect(row.age).toBeGreaterThanOrEqual(18);
      expect(row.age).toBeLessThanOrEqual(100);

      // isActive should be boolean
      expect(typeof row.isActive).toBe('boolean');
    });
  });

  it('should handle nullable fields', () => {
    const rules: GenerationRules = {
      optionalField: {
        columnName: 'optionalField',
        type: 'string',
        nullable: true,
        minLength: 1,
        maxLength: 10,
      },
    };

    const rows = generator.generateRows(rules, 100);

    // Some rows should have null values (probabilistically)
    const nullCount = rows.filter(r => r.optionalField === null).length;
    expect(nullCount).toBeGreaterThan(0);
  });

  it('should generate UUID values', () => {
    const rules: GenerationRules = {
      id: {
        columnName: 'id',
        type: 'uuid',
        nullable: false,
        generator: 'uuid',
      },
    };

    const rows = generator.generateRows(rules, 5);

    rows.forEach(row => {
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  it('should generate enum values from provided list', () => {
    const rules: GenerationRules = {
      status: {
        columnName: 'status',
        type: 'enum',
        nullable: false,
        values: ['active', 'inactive', 'pending'],
      },
    };

    const rows = generator.generateRows(rules, 20);

    rows.forEach(row => {
      expect(['active', 'inactive', 'pending']).toContain(row.status);
    });
  });

  it('should generate dates within range', () => {
    const minDate = '2020-01-01';
    const maxDate = '2023-12-31';

    const rules: GenerationRules = {
      createdAt: {
        columnName: 'createdAt',
        type: 'date',
        nullable: false,
        minDate,
        maxDate,
      },
    };

    const rows = generator.generateRows(rules, 10);

    rows.forEach(row => {
      const date = new Date(row.createdAt);
      expect(date.getTime()).toBeGreaterThanOrEqual(new Date(minDate).getTime());
      expect(date.getTime()).toBeLessThanOrEqual(new Date(maxDate).getTime());
    });
  });
});
