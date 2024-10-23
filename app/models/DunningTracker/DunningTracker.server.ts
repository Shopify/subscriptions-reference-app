import type {DunningTracker} from '@prisma/client';

import {DateTime} from 'luxon';
import prisma from '~/db.server';

interface UpsertArgs {
  shop: string;
  contractId: string;
  billingCycleIndex: number;
  failureReason: string;
}

export async function findOrCreateBy({
  shop,
  contractId,
  billingCycleIndex,
  failureReason,
}: UpsertArgs): Promise<DunningTracker> {
  return await prisma.dunningTracker.upsert({
    where: {
      uniqueBillingCycleFailure: {
        shop,
        contractId,
        billingCycleIndex,
        failureReason,
      },
    },
    create: {
      shop,
      contractId,
      billingCycleIndex,
      failureReason,
    },
    update: {},
  });
}

export async function markCompleted(tracker: DunningTracker): Promise<void> {
  const now = DateTime.utc().toJSDate();

  if (now === null) {
    throw new Error(
      'Failed to generate current datetime using DateTime.utc().toSQL()',
    );
  }

  await prisma.dunningTracker.update({
    where: {id: tracker.id},
    data: {completedAt: now},
  });
}
