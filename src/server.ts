/**
 * Fastify API server
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDb } from './lib/db';
import { profileRoutes } from './routes/profiles';
import { runRoutes } from './routes/runs';
import { templateRoutes } from './routes/templates';
import { scheduleRoutes } from './routes/schedules';
import { tagRoutes } from './routes/tags';
import { webhookRoutes } from './routes/webhooks';
import { snapshotRoutes } from './routes/snapshots';
import { errorHandler } from './lib/errors';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
  });

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  // Metrics endpoint
  fastify.get('/metrics', async () => {
    return {
      summary: metrics.getSummary(),
    };
  });

  // API root
  fastify.get('/api', async () => {
    return {
      name: 'Synthetic Data Generator API',
      version: '1.0.0',
      endpoints: {
        profiles: '/api/profiles',
        templates: '/api/templates',
        runs: '/api/runs',
        schedules: '/api/schedules',
        tags: '/api/tags',
        webhooks: '/api/webhooks',
        snapshots: '/api/snapshots',
        health: '/health',
        metrics: '/metrics',
      },
    };
  });

  // Register routes
  await fastify.register(profileRoutes);
  await fastify.register(runRoutes);
  await fastify.register(templateRoutes);
  await fastify.register(scheduleRoutes);
  await fastify.register(tagRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(snapshotRoutes);

  // Connect to database
  await connectDb();

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info('Server started', {
      port: PORT,
      host: HOST,
      env: process.env.NODE_ENV || 'development',
    });
    console.log(`\n🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`   Health: http://${HOST}:${PORT}/health`);
    console.log(`   API: http://${HOST}:${PORT}/api`);
    console.log(`   Metrics: http://${HOST}:${PORT}/metrics`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info('Received shutdown signal', { signal });
      console.log(`\nReceived ${signal}, closing server...`);
      await fastify.close();
      process.exit(0);
    });
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err as Error);
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start().catch(err => {
  logger.error('Failed to start server', err);
  console.error('Failed to start server:', err);
  process.exit(1);
});
