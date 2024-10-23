import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import * as factories from '#/factories';
import prisma from '~/db.server';

import {jobs} from '~/jobs';
import {
  ChargeBillingCyclesJob,
  ScheduleShopsToChargeBillingCyclesJob,
} from '~/jobs/billing';

vi.mock('~/jobs', () => {
  const originalModule = vi.importActual('~/jobs');
  return {
    ...originalModule,
    jobs: {
      enqueue: vi.fn(),
    },
  };
});

describe('ScheduleShopsToChargeBillingCyclesJob', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
    vi.restoreAllMocks();
  });

  it('schedules jobs for billable shops', async () => {
    await factories.billingSchedule.create({
      shop: 'shop-billable-1.myshopify.com',
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });

    await factories.billingSchedule.create({
      shop: 'shop-inactive-1.myshopify.com',
      hour: 10,
      timezone: 'America/Toronto',
      active: false,
    });

    await factories.billingSchedule.create({
      shop: 'shop-billable-2.myshopify.com',
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });

    await factories.billingSchedule.create({
      shop: 'shop-unbillable-1.myshopify.com',
      hour: 12,
      timezone: 'America/Toronto',
      active: true,
    });

    await factories.billingSchedule.create({
      shop: 'shop-unbillable-2.myshopify.com',
      hour: 10,
      timezone: 'America/Vancouver',
      active: true,
    });

    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    const job = new ScheduleShopsToChargeBillingCyclesJob({
      targetDate: '2023-07-14T14:00:00Z',
    });

    await job.perform();

    expect(enqueueSpy).toHaveBeenCalledTimes(2);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new ChargeBillingCyclesJob({
        shop: 'shop-billable-1.myshopify.com',
        payload: {
          startDate: '2023-07-13T03:59:59.999Z',
          endDate: '2023-07-15T03:59:59.999Z',
        },
      }),
    );

    expect(enqueueSpy).toHaveBeenCalledWith(
      new ChargeBillingCyclesJob({
        shop: 'shop-billable-2.myshopify.com',
        payload: {
          startDate: '2023-07-13T03:59:59.999Z',
          endDate: '2023-07-15T03:59:59.999Z',
        },
      }),
    );
  });
});
