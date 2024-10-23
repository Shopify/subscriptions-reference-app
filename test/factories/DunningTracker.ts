import type {DunningTracker, Prisma} from '@prisma/client';
import {Factory} from 'fishery';
import prisma from '~/db.server';

export const dunningTracker = Factory.define<
  Prisma.DunningTrackerCreateInput,
  {},
  DunningTracker
>(({onCreate, sequence}) => {
  onCreate((data) => prisma.dunningTracker.create({data}));

  return {
    shop: `shop-${sequence}.myshopify.com`,
    contractId: `gid://shopify/SubscriptionContract/${sequence}`,
    billingCycleIndex: sequence,
    failureReason: 'CARD_EXPIRED',
  };
});
