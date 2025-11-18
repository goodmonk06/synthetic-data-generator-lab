/**
 * Output writers for generated data
 */

import { createObjectCsvWriter } from 'csv-writer';
import { writeFile } from 'fs/promises';
import { GeneratedRow } from './dataGenerator';
import * as path from 'path';

export type OutputFormat = 'csv' | 'json';

/**
 * Write generated data to a file
 */
export async function writeOutput(
  data: GeneratedRow[],
  format: OutputFormat,
  outputDir: string,
  fileName: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = `${fileName}_${timestamp}`;
  const fullPath = path.join(outputDir, `${baseFileName}.${format}`);

  if (format === 'csv') {
    await writeCsv(data, fullPath);
  } else if (format === 'json') {
    await writeJson(data, fullPath);
  }

  return fullPath;
}

/**
 * Write data as CSV
 */
async function writeCsv(data: GeneratedRow[], filePath: string): Promise<void> {
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

/**
 * Write data as JSON
 */
async function writeJson(data: GeneratedRow[], filePath: string): Promise<void> {
  const jsonContent = JSON.stringify(data, null, 2);
  await writeFile(filePath, jsonContent, 'utf-8');
}
