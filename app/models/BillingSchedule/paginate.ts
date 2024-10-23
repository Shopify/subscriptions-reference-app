import type {BillingSchedule, Prisma} from '@prisma/client';
import prisma from '~/db.server';

export type PaginatorCallbackFn = (records: BillingSchedule[]) => Promise<void>;

const defaults: Prisma.BillingScheduleFindManyArgs = {
  orderBy: {id: 'asc'},
  take: 1000,
};

export async function paginate(
  args: Prisma.BillingScheduleFindManyArgs,
  callback: PaginatorCallbackFn,
  cursor?: number,
): Promise<void> {
  const cursorArgs: Prisma.BillingScheduleFindManyArgs =
    cursor === undefined ? {} : {cursor: {id: cursor}, skip: 1};

  const batch = await prisma.billingSchedule.findMany({
    ...defaults,
    ...args,
    ...cursorArgs,
  });

  if (batch.length === 0) {
    return;
  }

  await callback(batch);

  const nextCursor = batch[batch.length - 1].id;
  return await paginate(args, callback, nextCursor);
}
