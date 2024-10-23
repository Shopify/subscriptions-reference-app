import {mockShopifyServer} from '#/test-utils';
import {TEST_SHOP} from '#/constants';
import {setUpValidSession} from '#/utils/setup-valid-session';
import {
  buildDunningService,
  buildInventoryService,
} from '~/models/Dunning/Dunning.server';

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
import {InventoryService} from '~/services/InventoryService';

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
      let active = 'ACTIVE' as SubscriptionContractSubscriptionStatus;
      let unbilled = 'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus;

      const inventoryService = new InventoryService({
        shopDomain: TEST_SHOP,
        contract: {
          id: '1',
          status: active,
        },
        billingCycle: {
          cycleIndex: 0,
          billingAttemptExpectedDate: '2024-04-19T00:00:00Z',
          status: unbilled,
          billingAttempts: {edges: []},
        },
        settings: {
          id: '1',
          onFailure: 'skip',
          retryAttempts: 3,
          daysBetweenRetryAttempts: 7,
          inventoryOnFailure: 'skip',
          inventoryDaysBetweenRetryAttempts: 3,
          inventoryRetryAttempts: 5,
          inventoryNotificationFrequency: 'monthly',
        },
        failureReason: 'insufficient_inventory',
      });

      vi.mocked(buildInventoryService).mockResolvedValue(inventoryService);
      vi.spyOn(inventoryService, 'run').mockResolvedValue(
        'INSUFFICIENT_INVENTORY',
      );

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
      let active = 'ACTIVE' as SubscriptionContractSubscriptionStatus;
      let unbilled = 'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus;

      const inventoryService = new InventoryService({
        shopDomain: TEST_SHOP,
        contract: {
          id: '1',
          status: active,
        },
        billingCycle: {
          cycleIndex: 0,
          status: unbilled,
          billingAttemptExpectedDate: '2024-04-19T00:00:00Z',
          billingAttempts: {edges: []},
        },
        settings: {
          id: '1',
          onFailure: 'skip',
          retryAttempts: 3,
          daysBetweenRetryAttempts: 7,
          inventoryDaysBetweenRetryAttempts: 3,
          inventoryRetryAttempts: 5,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
        },
        failureReason: 'inventory_allocations_not_found',
      });

      vi.mocked(buildInventoryService).mockResolvedValue(inventoryService);
      vi.spyOn(inventoryService, 'run').mockResolvedValue(
        'INVENTORY_ALLOCATIONS_NOT_FOUND',
      );

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
          billingAttemptExpectedDate: '2024-04-19T00:00:00Z',
          billingAttempts: {edges: []},
        },
        settings: {
          id: '1',
          onFailure: 'skip',
          retryAttempts: 5,
          daysBetweenRetryAttempts: 7,
          inventoryRetryAttempts: 3,
          inventoryDaysBetweenRetryAttempts: 7,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
        },
        failureReason: 'insufficient_funds',
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
