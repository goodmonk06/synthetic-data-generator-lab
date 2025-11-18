/**
 * Metrics collection abstraction
 * Currently in-memory, but designed to be swapped with Prometheus, Datadog, etc.
 */

import { logger } from './logger';

export interface MetricLabels {
  [key: string]: string | number;
}

export interface Metric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.METRICS_ENABLED === 'true';
  }

  /**
   * Record a counter metric
   */
  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    if (!this.enabled) return;

    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);
    this.metrics.set(name, existing);

    logger.debug('Metric recorded', { metric: name, value, labels });
  }

  /**
   * Record a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
    };

    // For gauges, we only keep the latest value
    this.metrics.set(name, [metric]);

    logger.debug('Gauge set', { metric: name, value, labels });
  }

  /**
   * Record a histogram metric (for durations, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    if (!this.enabled) return;

    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);
    this.metrics.set(name, existing);

    logger.debug('Histogram recorded', { metric: name, value, labels });
  }

  /**
   * Get all metrics (for debug or export)
   */
  getAllMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { count: number; sum: number; avg: number; latest: number }> {
    const summary: Record<string, any> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      summary[name] = {
        count: metrics.length,
        sum,
        avg: sum / metrics.length,
        latest: values[values.length - 1] || 0,
      };
    }

    return summary;
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const metrics = new MetricsCollector();

// Common metric names
export const MetricNames = {
  // Profile metrics
  PROFILE_CREATED: 'profile.created',
  PROFILE_UPDATED: 'profile.updated',
  PROFILE_DELETED: 'profile.deleted',
  TEMPLATE_INSTANTIATED: 'template.instantiated',

  // Run metrics
  RUN_STARTED: 'run.started',
  RUN_COMPLETED: 'run.completed',
  RUN_FAILED: 'run.failed',
  RUN_DURATION_MS: 'run.duration_ms',
  ROWS_GENERATED: 'run.rows_generated',

  // Schedule metrics
  SCHEDULE_TRIGGERED: 'schedule.triggered',
  SCHEDULE_CREATED: 'schedule.created',

  // System metrics
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',
  DB_QUERY: 'db.query',
};
