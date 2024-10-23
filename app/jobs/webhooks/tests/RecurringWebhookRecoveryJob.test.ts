import {WebhookSubscriptionRecoveryJob} from '../WebhookSubscriptionRecoveryJob';

import type {Mock} from 'vitest';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {RecurringWebhookRecoveryJob} from '../RecurringWebhookRecoveryJob';

vi.mock('~/models/BillingSchedule/BillingSchedule.server', () => ({
  findActiveBillingSchedulesInBatches: vi.fn(),
}));

describe('RecurringWebhookRecoveryJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should enqueue a WebhookSubscriptionRecoveryJob for each shop with active billing schedules', async () => {
    const testBatch = [
      {shop: 'shop-billable-1.myshopify.com'},
      {shop: 'shop-billable-2.myshopify.com'},
    ];

    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    (findActiveBillingSchedulesInBatches as Mock).mockImplementation(
      async (callback) => {
        await callback(testBatch);
      },
    );

    const job = new RecurringWebhookRecoveryJob({});
    await job.perform();

    expect(findActiveBillingSchedulesInBatches).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalledTimes(testBatch.length);

    testBatch.forEach((billingSchedule) => {
      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining(
          new WebhookSubscriptionRecoveryJob({
            shop: billingSchedule.shop,
            payload: {},
          }),
        ),
      );
    });
  });

  it('should not enqueue a WebhookSubscriptionRecoveryJob for shops with no active billing schedules', async () => {
    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    (findActiveBillingSchedulesInBatches as Mock).mockImplementation(
      async (callback) => {
        await callback([]);
      },
    );

    const job = new RecurringWebhookRecoveryJob({});
    await job.perform();

    expect(findActiveBillingSchedulesInBatches).toHaveBeenCalled();
    expect(enqueueSpy).not.toHaveBeenCalled();
  });
});
