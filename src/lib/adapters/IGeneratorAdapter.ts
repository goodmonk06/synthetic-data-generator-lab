/**
 * Generator adapter interface
 * Allows plugging in different data generation strategies
 */

import { GenerationRule } from '../ruleGenerator';

export interface GeneratorContext {
  rowIndex: number;
  totalRows: number;
  previousRow?: Record<string, any>;
}

export interface IGeneratorAdapter {
  /**
   * Generate a value for a specific rule
   */
  generateValue(
    rule: GenerationRule,
    context: GeneratorContext
  ): any | Promise<any>;

  /**
   * Check if this adapter can handle the given rule
   */
  canHandle(rule: GenerationRule): boolean;

  /**
   * Get adapter name
   */
  getName(): string;
}
