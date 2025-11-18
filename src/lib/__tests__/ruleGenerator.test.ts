/**
 * Tests for rule generator
 */

import { describe, it, expect } from 'vitest';
import { inferRulesFromSchema } from '../ruleGenerator';
import { TableSchema } from '../sqlParser';

describe('inferRulesFromSchema', () => {
  it('should infer email generator from column name', () => {
    const schema: TableSchema = {
      tableName: 'users',
      columns: [
        {
          name: 'email',
          type: 'VARCHAR(255)',
          nullable: false,
          primaryKey: false,
          unique: true,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    expect(rules.email.type).toBe('email');
    expect(rules.email.generator).toBe('email');
  });

  it('should infer firstName and lastName generators', () => {
    const schema: TableSchema = {
      tableName: 'users',
      columns: [
        {
          name: 'first_name',
          type: 'VARCHAR(100)',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
        {
          name: 'last_name',
          type: 'VARCHAR(100)',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    expect(rules.first_name.generator).toBe('firstName');
    expect(rules.last_name.generator).toBe('lastName');
  });

  it('should infer phone generator from column name', () => {
    const schema: TableSchema = {
      tableName: 'contacts',
      columns: [
        {
          name: 'phone',
          type: 'VARCHAR(20)',
          nullable: true,
          primaryKey: false,
          unique: false,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    expect(rules.phone.type).toBe('phone');
    expect(rules.phone.generator).toBe('phone');
    expect(rules.phone.nullable).toBe(true);
  });

  it('should set appropriate ranges for integers', () => {
    const schema: TableSchema = {
      tableName: 'products',
      columns: [
        {
          name: 'id',
          type: 'SERIAL',
          nullable: false,
          primaryKey: true,
          unique: true,
        },
        {
          name: 'stock',
          type: 'INT',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    // Primary key should start from 1
    expect(rules.id.min).toBe(1);

    // Regular int should start from 0
    expect(rules.stock.min).toBe(0);
  });

  it('should extract VARCHAR length', () => {
    const schema: TableSchema = {
      tableName: 'test',
      columns: [
        {
          name: 'code',
          type: 'VARCHAR(10)',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    expect(rules.code.maxLength).toBe(10);
  });

  it('should infer special generators for common fields', () => {
    const schema: TableSchema = {
      tableName: 'companies',
      columns: [
        {
          name: 'company',
          type: 'VARCHAR(255)',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
        {
          name: 'address',
          type: 'TEXT',
          nullable: true,
          primaryKey: false,
          unique: false,
        },
        {
          name: 'city',
          type: 'VARCHAR(100)',
          nullable: false,
          primaryKey: false,
          unique: false,
        },
      ],
    };

    const rules = inferRulesFromSchema(schema);

    expect(rules.company.generator).toBe('company');
    expect(rules.address.generator).toBe('address');
    expect(rules.city.generator).toBe('city');
  });
});
