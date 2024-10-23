import {TEST_SHOP} from '#/constants';
import * as factories from '#/factories';
import {afterEach, describe, expect, it, vi} from 'vitest';
import prisma from '~/db.server';
import type {Jobs, Webhooks} from '~/types';
import {DeleteBillingScheduleJob} from '~/jobs/shop';

describe('DeleteBillingScheduleJob#perform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes billing schedules for the shop', async () => {
    await prisma.billingSchedule.deleteMany();
    await factories.billingSchedule.create({
      shop: TEST_SHOP,
      active: true,
    });

    const shopRedactWebhook: Webhooks.ShopRedact = {
      shop_domain: TEST_SHOP,
      shop_id: 1,
    };

    const params: Jobs.Parameters<Webhooks.ShopRedact> = {
      shop: TEST_SHOP,
      payload: shopRedactWebhook,
    };

    const job = new DeleteBillingScheduleJob(params);

    await job.perform();

    const billingSchedules = await prisma.billingSchedule.findMany({
      where: {
        shop: TEST_SHOP,
      },
    });

    expect(billingSchedules).toEqual([]);
  });
});
