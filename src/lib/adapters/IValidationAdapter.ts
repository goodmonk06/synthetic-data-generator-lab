/**
 * Validation adapter interface
 * Allows custom validation of generated data
 */

import { GeneratedRow } from '../dataGenerator';
import { GenerationRules } from '../ruleGenerator';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  message: string;
  context?: Record<string, any>;
}

export interface IValidationAdapter {
  /**
   * Validate generated data against rules
   */
  validate(
    data: GeneratedRow[],
    rules: GenerationRules
  ): Promise<ValidationResult>;

  /**
   * Get validator name
   */
  getName(): string;
}
