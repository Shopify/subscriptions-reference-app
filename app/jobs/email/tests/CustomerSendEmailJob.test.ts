import {mockShopifyServer} from '#/test-utils';
import {TEST_SHOP} from '#/constants';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Jobs, Webhooks} from '~/types';
import {CustomerSendEmailJob} from '~/jobs/email';
import {
  skipSubscriptionContractEvent,
  cancelledSubscriptionContractEvent,
  newSubscriptionContractEvent,
  pausedSubscriptionContractEvent,
  resumedSubscriptionContractEvent,
} from '~/jobs/email/tests/fixtures';
import {CustomerSendEmailService} from '~/services/CustomerSendEmailService';

vi.mock('~/services/CustomerSendEmailService', async (importOriginal) => {
  const original: any = await importOriginal();
  const CustomerSendEmailService = vi.fn();
  CustomerSendEmailService.prototype.run = vi.fn().mockResolvedValue(undefined);

  return {...original, CustomerSendEmailService};
});

describe('CustomerSendEmailJob#perform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('skip billing cycle subscription contract', () => {
    it('sends a customer email', async () => {
      const {mockGraphQL} = mockShopifyServer();
      mockGraphQL({
        SubscriptionContractCustomerQuery: {
          data: {
            subscriptionContract: {
              customer: {
                id: 'gid://shopify/Customer/1',
              },
            },
          },
        },
      });

      const job = new CustomerSendEmailJob({
        shop: TEST_SHOP,
        payload: skipSubscriptionContractEvent,
      });

      await job.perform();

      expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
        TEST_SHOP,
        'gid://shopify/Customer/1',
        {
          subscriptionContractId: 'gid://shopify/SubscriptionContract/1',
          billingCycleIndex: 1,
          subscriptionTemplateName: 'SUBSCRIPTION_SKIPPED',
        },
      );
    });
  });

  describe('cancelled subscription contract', () => {
    it('sends cancel customer email', async () => {
      const task: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
        shop: TEST_SHOP,
        payload: cancelledSubscriptionContractEvent,
      };
      const job = new CustomerSendEmailJob(task);
      await job.perform();

      expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
        TEST_SHOP,
        cancelledSubscriptionContractEvent.admin_graphql_api_customer_id,
        {
          subscriptionContractId:
            cancelledSubscriptionContractEvent.admin_graphql_api_id,
          subscriptionTemplateName: 'SUBSCRIPTION_CANCELED',
        },
      );
    });
  });

  describe('created subscription contract', () => {
    describe('when contract was created with checkout', () => {
      it('sends create customer email', async () => {
        const task: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
          shop: TEST_SHOP,
          payload: newSubscriptionContractEvent,
        };
        const job = new CustomerSendEmailJob(task);
        await job.perform();

        expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
          TEST_SHOP,
          newSubscriptionContractEvent.admin_graphql_api_customer_id,
          {
            subscriptionContractId:
              newSubscriptionContractEvent.admin_graphql_api_id,
            subscriptionTemplateName: 'NEW_SUBSCRIPTION',
          },
        );
      });
    });
  });

  describe('paused subscription contract', () => {
    it('sends a customer email', async () => {
      const params: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
        shop: TEST_SHOP,
        payload: pausedSubscriptionContractEvent,
      };
      const job = new CustomerSendEmailJob(params);

      await job.perform();

      expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
        TEST_SHOP,
        pausedSubscriptionContractEvent.admin_graphql_api_customer_id,
        {
          subscriptionContractId:
            pausedSubscriptionContractEvent.admin_graphql_api_id,
          subscriptionTemplateName: 'SUBSCRIPTION_PAUSED',
        },
      );
    });
  });

  describe('resumed subscription contract', () => {
    it('sends a customer email', async () => {
      const params: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
        shop: TEST_SHOP,
        payload: resumedSubscriptionContractEvent,
      };
      const job = new CustomerSendEmailJob(params);

      await job.perform();

      expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
        TEST_SHOP,
        resumedSubscriptionContractEvent.admin_graphql_api_customer_id,
        {
          subscriptionContractId:
            resumedSubscriptionContractEvent.admin_graphql_api_id,
          subscriptionTemplateName: 'SUBSCRIPTION_RESUMED',
        },
      );
    });
  });
});
