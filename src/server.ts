import { env } from './config/env';
import { prisma } from './config/database';
import app from './app';

const PORT = env.port;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('[DB] Conectado ao PostgreSQL.');

    app.listen(PORT, () => {
      console.log(`[Server] Age Treino rodando em http://localhost:${PORT}`);
      console.log(`[Server] Ambiente: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('[Server] Falha ao iniciar:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n[Server] Encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Do not exit process immediately, let the application decide, or log and exit
});

main();
