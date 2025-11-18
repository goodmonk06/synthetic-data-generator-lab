/**
 * Fastify API server
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDb } from './lib/db';
import { profileRoutes } from './routes/profiles';
import { runRoutes } from './routes/runs';
import { errorHandler } from './lib/errors';

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

  // API root
  fastify.get('/api', async () => {
    return {
      name: 'Synthetic Data Generator API',
      version: '1.0.0',
      endpoints: {
        profiles: '/api/profiles',
        runs: '/api/runs',
        health: '/health',
      },
    };
  });

  // Register routes
  await fastify.register(profileRoutes);
  await fastify.register(runRoutes);

  // Connect to database
  await connectDb();

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`   Health: http://${HOST}:${PORT}/health`);
    console.log(`   API: http://${HOST}:${PORT}/api`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`\nReceived ${signal}, closing server...`);
      await fastify.close();
      process.exit(0);
    });
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
