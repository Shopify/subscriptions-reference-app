import {mockShopifyServer} from '#/test-utils';
import {TEST_SHOP} from '#/constants';
import {setUpValidSession} from '#/utils/setup-valid-session';
import {buildDunningService} from '~/models/Dunning/Dunning.server';

import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {DunningStartJob} from '~/jobs/dunning';
import {sessionStorage} from '~/shopify.server';
import type {
  SubscriptionBillingCycleBillingCycleStatus,
  SubscriptionContractSubscriptionStatus,
} from 'types/admin.types';
import type {Jobs, Webhooks} from '~/types';
import {
  SubscriptionBillingAttemptInsufficientInventoryWebhook,
  SubscriptionBillingAttemptInventoryAllocationsNotFoundWebhook,
  SubscriptionBillingAttemptInsufficientFundsWebhook,
} from './fixtures/SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE';
import {logger} from '~/utils/logger.server';
import {DunningService} from '~/services/DunningService';

vi.mock('~/utils/logger.server');
vi.mock('~/models/Dunning/Dunning.server');
vi.mock('~/models/Settings/Settings.server');
vi.mock('~/models/SubscriptionContract/SubscriptionContract.server');
vi.mock(
  '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server',
);

function errorGraphQLResponses() {
  return {
    SubscriptionContractActivateMutation: {
      data: {
        subscriptionContractActivate: {
          userErrors: ['This is an error'],
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('DunningStartJob#perform', () => {
  beforeAll(async () => {
    await setUpValidSession(sessionStorage);
  });

  afterEach(async () => {
    graphQL.mockRestore();
  });

  describe('with an Insufficient Inventory error', async () => {
    const task: Jobs.Parameters<Webhooks.SubscriptionBillingAttemptFailure> = {
      shop: TEST_SHOP,
      payload: SubscriptionBillingAttemptInsufficientInventoryWebhook,
    };
    const job = new DunningStartJob(task);
    it('calls inventory service', async () => {
      vi.mocked(logger.info).mockResolvedValue();
      await job.perform();
      expect(logger.info).toHaveBeenCalledWith(
        {
          result: 'INSUFFICIENT_INVENTORY',
        },
        'Completed Unavailable Inventory error',
      );
    });
  });

  describe('with an Inventory Allocations Not Found error', async () => {
    const task: Jobs.Parameters<Webhooks.SubscriptionBillingAttemptFailure> = {
      shop: TEST_SHOP,
      payload: SubscriptionBillingAttemptInventoryAllocationsNotFoundWebhook,
    };
    const job = new DunningStartJob(task);
    it('calls inventory service', async () => {
      vi.mocked(logger.info).mockResolvedValue();
      await job.perform();
      expect(logger.info).toHaveBeenCalledWith(
        {
          result: 'INVENTORY_ALLOCATIONS_NOT_FOUND',
        },
        'Completed Unavailable Inventory error',
      );
    });
  });

  describe('with an Insufficient Funds error', async () => {
    const task: Jobs.Parameters<Webhooks.SubscriptionBillingAttemptFailure> = {
      shop: TEST_SHOP,
      payload: SubscriptionBillingAttemptInsufficientFundsWebhook,
    };
    const job = new DunningStartJob(task);
    it('calls dunning service', async () => {
      mockGraphQL(errorGraphQLResponses());

      let active = 'ACTIVE' as SubscriptionContractSubscriptionStatus;
      let unbilled = 'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus;

      const dunningService = new DunningService({
        shopDomain: TEST_SHOP,
        contract: {
          id: '1',
          status: active,
        },
        billingCycle: {
          cycleIndex: 0,
          status: unbilled,
          billingAttempts: {edges: []},
        },
        settings: {
          id: '1',
          onFailure: 'skip',
          retryAttempts: 3,
          daysBetweenRetryAttempts: 7,
          inventoryRetryAttempts: 3,
          inventoryDaysBetweenRetryAttempts: 7,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
        },
        failureReason: 'INSUFFICIENT_FUNDS',
      });

      vi.mocked(buildDunningService).mockResolvedValue(dunningService);
      vi.spyOn(dunningService, 'run').mockResolvedValue('RETRY_DUNNING');

      vi.mocked(logger.info).mockResolvedValue();

      await job.perform();
      expect(dunningService.run).toBeCalled();
      expect(logger.info).toHaveBeenCalledWith(
        {
          result: 'RETRY_DUNNING',
        },
        'Completed DunningService',
      );
    });
  });
});
