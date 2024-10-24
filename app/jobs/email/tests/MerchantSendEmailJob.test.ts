import {afterEach, describe, expect, it, vi} from 'vitest';
import {TEST_SHOP} from '#/constants';
import {cancelledSubscriptionContractEvent} from './fixtures';
import type {Jobs, Webhooks} from '~/types';
import {MerchantSendEmailService} from '~/services/MerchantSendEmailService';
import {MerchantSendEmailJob} from '~/jobs/email';

vi.mock('~/services/MerchantSendEmailService', async (importOriginal) => {
  const original: any = await importOriginal();
  const MerchantSendEmailService = vi.fn();
  MerchantSendEmailService.prototype.run = vi.fn().mockResolvedValue(undefined);

  return {...original, MerchantSendEmailService};
});

describe('MerchantSendEmailJob#perform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with a valid set of params', () => {
    it('sends a merchant email', async () => {
      const task: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
        shop: TEST_SHOP,
        payload: cancelledSubscriptionContractEvent,
      };
      const job = new MerchantSendEmailJob(task);
      await job.perform();

      expect(MerchantSendEmailService.prototype.run).toHaveBeenCalledWith(
        TEST_SHOP,
        {
          subscriptionContractId:
            cancelledSubscriptionContractEvent.admin_graphql_api_id,
          subscriptionTemplateName: 'SUBSCRIPTION_CANCELED__MERCHANT_',
        },
      );
    });
  });
});
