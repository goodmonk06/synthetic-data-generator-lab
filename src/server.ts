/**
 * Fastify API server
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDb } from './lib/db';
import { profileRoutes } from './routes/profiles';
import { runRoutes } from './routes/runs';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: true,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
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

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
