/**
 * Output adapter interface
 * Allows writing generated data to different destinations
 */

import { GeneratedRow } from '../dataGenerator';

export interface OutputMetadata {
  profileId: string;
  runId: string;
  rowCount: number;
  format: string;
  [key: string]: any;
}

export interface OutputResult {
  destination: string;
  bytesWritten?: number;
  rowsWritten: number;
  metadata?: Record<string, any>;
}

export interface IOutputAdapter {
  /**
   * Write generated data
   */
  write(
    data: GeneratedRow[],
    metadata: OutputMetadata
  ): Promise<OutputResult>;

  /**
   * Get supported format
   */
  getFormat(): string;

  /**
   * Validate configuration
   */
  validateConfig(): boolean;
}
