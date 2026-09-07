import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { seedAdminUser } from './config/seedAdmin';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await seedAdminUser();

  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(env.PORT, '0.0.0.0', () => {
      server.off('error', reject);
      resolve();
    });
  });

  console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use`);
  } else {
    console.error('Failed to start server:', error);
  }
  process.exit(1);
});
