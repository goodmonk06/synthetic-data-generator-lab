/**
 * Central registry for all adapters
 */

import { IGeneratorAdapter } from './IGeneratorAdapter';
import { IOutputAdapter } from './IOutputAdapter';
import { INotificationAdapter } from './INotificationAdapter';
import { IValidationAdapter } from './IValidationAdapter';
import { FakerGeneratorAdapter } from './implementations/FakerGeneratorAdapter';
import { FileOutputAdapter } from './implementations/FileOutputAdapter';
import { ConsoleNotificationAdapter } from './implementations/ConsoleNotificationAdapter';
import { logger } from '../logger';

export class AdapterRegistry {
  private generatorAdapters: Map<string, IGeneratorAdapter> = new Map();
  private outputAdapters: Map<string, IOutputAdapter> = new Map();
  private notificationAdapters: Map<string, INotificationAdapter> = new Map();
  private validationAdapters: Map<string, IValidationAdapter> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // Register default adapters
    this.registerGeneratorAdapter('faker', new FakerGeneratorAdapter());
    this.registerOutputAdapter('csv', new FileOutputAdapter('csv'));
    this.registerOutputAdapter('json', new FileOutputAdapter('json'));
    this.registerNotificationAdapter('console', new ConsoleNotificationAdapter());
  }

  // Generator adapters
  registerGeneratorAdapter(name: string, adapter: IGeneratorAdapter): void {
    this.generatorAdapters.set(name, adapter);
    logger.debug('Generator adapter registered', { name });
  }

  getGeneratorAdapter(name: string): IGeneratorAdapter | undefined {
    return this.generatorAdapters.get(name);
  }

  getAllGeneratorAdapters(): IGeneratorAdapter[] {
    return Array.from(this.generatorAdapters.values());
  }

  // Output adapters
  registerOutputAdapter(format: string, adapter: IOutputAdapter): void {
    this.outputAdapters.set(format, adapter);
    logger.debug('Output adapter registered', { format });
  }

  getOutputAdapter(format: string): IOutputAdapter | undefined {
    return this.outputAdapters.get(format);
  }

  // Notification adapters
  registerNotificationAdapter(name: string, adapter: INotificationAdapter): void {
    this.notificationAdapters.set(name, adapter);
    logger.debug('Notification adapter registered', { name });
  }

  getNotificationAdapter(name: string): INotificationAdapter | undefined {
    return this.notificationAdapters.get(name);
  }

  getAllNotificationAdapters(): INotificationAdapter[] {
    return Array.from(this.notificationAdapters.values());
  }

  // Validation adapters
  registerValidationAdapter(name: string, adapter: IValidationAdapter): void {
    this.validationAdapters.set(name, adapter);
    logger.debug('Validation adapter registered', { name });
  }

  getValidationAdapter(name: string): IValidationAdapter | undefined {
    return this.validationAdapters.get(name);
  }
}

// Global singleton
export const adapterRegistry = new AdapterRegistry();
