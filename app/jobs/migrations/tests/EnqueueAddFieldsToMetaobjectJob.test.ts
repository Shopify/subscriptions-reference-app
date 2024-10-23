import {AddFieldsToMetaobjectJob} from '../AddFieldsToMetaobjectJob';

import type {Mock} from 'vitest';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {EnqueueAddFieldsToMetaobjectJob} from '../EnqueueAddFieldsToMetaobjectJob';

vi.mock('~/models/BillingSchedule/BillingSchedule.server', () => ({
  findActiveBillingSchedulesInBatches: vi.fn(),
}));

describe('EnqueueAddFieldsToMetaobjectJob', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should enqueue a AddFieldsToMetaobjectJob for each shop with active billing schedules', async () => {
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

    const job = new EnqueueAddFieldsToMetaobjectJob({});
    await job.perform();

    expect(findActiveBillingSchedulesInBatches).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalledTimes(testBatch.length);

    testBatch.forEach((billingSchedule) => {
      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining(
          new AddFieldsToMetaobjectJob({
            shop: billingSchedule.shop,
            payload: {},
          }),
        ),
      );
    });
  });

  it('should not enqueue a AddFieldsToMetaobjectJob for shops with no active billing schedules', async () => {
    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    (findActiveBillingSchedulesInBatches as Mock).mockImplementation(
      async (callback) => {
        await callback([]);
      },
    );

    const job = new EnqueueAddFieldsToMetaobjectJob({});
    await job.perform();

    expect(findActiveBillingSchedulesInBatches).toHaveBeenCalled();
    expect(enqueueSpy).not.toHaveBeenCalled();
  });
});
