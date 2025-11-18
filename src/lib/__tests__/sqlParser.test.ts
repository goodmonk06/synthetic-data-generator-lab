/**
 * Tests for SQL parser
 */

import { describe, it, expect } from 'vitest';
import { parseCreateTableStatement, sqlTypeToGenerationType } from '../sqlParser';

describe('sqlParser', () => {
  describe('parseCreateTableStatement', () => {
    it('should parse a simple CREATE TABLE statement', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE
        );
      `;

      const result = parseCreateTableStatement(sql);

      expect(result.tableName).toBe('users');
      expect(result.columns).toHaveLength(3);
      expect(result.columns[0].name).toBe('id');
      expect(result.columns[0].type).toContain('SERIAL');
      expect(result.columns[0].primaryKey).toBe(true);
    });

    it('should parse column constraints correctly', () => {
      const sql = `
        CREATE TABLE products (
          id INT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2),
          active BOOLEAN DEFAULT true
        );
      `;

      const result = parseCreateTableStatement(sql);

      expect(result.columns[1].nullable).toBe(false);
      expect(result.columns[2].nullable).toBe(true);
      expect(result.columns[3].defaultValue).toBe('true');
    });

    it('should handle IF NOT EXISTS syntax', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS test_table (id INT)';
      const result = parseCreateTableStatement(sql);
      expect(result.tableName).toBe('test_table');
    });

    it('should throw error for invalid SQL', () => {
      expect(() => parseCreateTableStatement('INVALID SQL')).toThrow();
    });
  });

  describe('sqlTypeToGenerationType', () => {
    it('should map SQL types to generation types correctly', () => {
      expect(sqlTypeToGenerationType('INT')).toBe('int');
      expect(sqlTypeToGenerationType('SERIAL')).toBe('int');
      expect(sqlTypeToGenerationType('BIGINT')).toBe('int');
      expect(sqlTypeToGenerationType('VARCHAR(255)')).toBe('string');
      expect(sqlTypeToGenerationType('TEXT')).toBe('string');
      expect(sqlTypeToGenerationType('DECIMAL(10,2)')).toBe('float');
      expect(sqlTypeToGenerationType('BOOLEAN')).toBe('boolean');
      expect(sqlTypeToGenerationType('DATE')).toBe('date');
      expect(sqlTypeToGenerationType('TIMESTAMP')).toBe('datetime');
      expect(sqlTypeToGenerationType('UUID')).toBe('uuid');
    });
  });
});
