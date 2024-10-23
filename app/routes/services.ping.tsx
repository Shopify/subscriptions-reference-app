import {Prisma} from '@prisma/client';

import prisma from '~/db.server';
import {logger} from '~/utils/logger.server';

export async function loader() {
  try {
    await checkDatabaseConnection();
    return new Response('ok', {status: 200});
  } catch (err) {
    logger.error({err}, 'Healthcheck failed');

    throw new Response('unavailable', {status: 500});
  }
}

async function checkDatabaseConnection(): Promise<void> {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return;
  }
  await prisma.$queryRaw(Prisma.sql`SELECT 1`);
}
