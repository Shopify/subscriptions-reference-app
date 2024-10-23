import type {BillingSchedule, Prisma} from '@prisma/client';
import {Factory} from 'fishery';
import prisma from '~/db.server';

export const billingSchedule = Factory.define<
  Prisma.BillingScheduleCreateInput,
  {},
  BillingSchedule
>(({onCreate, sequence}) => {
  onCreate((data) => prisma.billingSchedule.create({data}));

  return {
    shop: `shop-${sequence}.myshopify.com`,
  };
});
