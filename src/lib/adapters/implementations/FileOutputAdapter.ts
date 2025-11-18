/**
 * File output adapter (CSV/JSON)
 */

import { createObjectCsvWriter } from 'csv-writer';
import { writeFile } from 'fs/promises';
import * as path from 'path';
import { IOutputAdapter, OutputMetadata, OutputResult } from '../IOutputAdapter';
import { GeneratedRow } from '../../dataGenerator';

export class FileOutputAdapter implements IOutputAdapter {
  constructor(private format: 'csv' | 'json', private baseDir: string = './output') {}

  getFormat(): string {
    return this.format;
  }

  validateConfig(): boolean {
    return true; // Basic validation
  }

  async write(data: GeneratedRow[], metadata: OutputMetadata): Promise<OutputResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${metadata.profileId}_${timestamp}.${this.format}`;
    const fullPath = path.join(this.baseDir, fileName);

    if (this.format === 'csv') {
      await this.writeCsv(data, fullPath);
    } else {
      await this.writeJson(data, fullPath);
    }

    return {
      destination: fullPath,
      rowsWritten: data.length,
    };
  }

  private async writeCsv(data: GeneratedRow[], filePath: string): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to write');
    }

    const headers = Object.keys(data[0]).map(key => ({
      id: key,
      title: key,
    }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);
  }

  private async writeJson(data: GeneratedRow[], filePath: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');
  }
}
