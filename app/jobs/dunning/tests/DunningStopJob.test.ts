import {mockShopifyServer} from '#/test-utils';
import {TEST_SHOP} from '#/constants';
import * as factories from '#/factories';
import {setUpValidSession} from '#/utils/setup-valid-session';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import prisma from '~/db.server';
import SubscriptionContractResume from '~/graphql/SubscriptionContractResumeMutation';
import {DunningStopJob} from '~/jobs';
import {sessionStorage} from '~/shopify.server';
import type {Jobs, Webhooks} from '~/types';
import {SubscriptionBillingAttemptSuccessWebhook} from './fixtures/SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS';

function defaultGraphQLResponses() {
  return {
    SubscriptionContractResume: {
      data: {
        subscriptionContractActivate: {
          contract: {
            id: 'gid://shopify/SubscriptionContract/1',
            status: 'ACTIVE',
          },
          userErrors: [],
        },
      },
    },
  };
}

function errorGraphQLResponses() {
  return {
    SubscriptionContractResume: {
      data: {
        subscriptionContractActivate: {
          userErrors: ['This is an error'],
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('DunningStopJob#perform', () => {
  beforeAll(async () => {
    await setUpValidSession(sessionStorage);
  });

  afterEach(async () => {
    graphQL.mockRestore();
    await prisma.dunningTracker.deleteMany();
  });

  describe('with a valid set of params', async () => {
    const task: Jobs.Parameters<Webhooks.SubscriptionBillingAttemptSuccess> = {
      shop: TEST_SHOP,
      payload: SubscriptionBillingAttemptSuccessWebhook,
    };
    const job = new DunningStopJob(task);

    it('reactivates the failed contract', async () => {
      mockGraphQL(defaultGraphQLResponses());

      const dunningTracker = await factories.dunningTracker.create({
        shop: TEST_SHOP,
        contractId:
          SubscriptionBillingAttemptSuccessWebhook.admin_graphql_api_subscription_contract_id,
        billingCycleIndex: 1,
        failureReason: 'CARD_EXPIRED',
      });

      vi.spyOn(job, 'getDunningTracker').mockResolvedValue(dunningTracker);

      await job.perform();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractResume,
        {
          variables: {
            subscriptionContractId: 'gid://shopify/SubscriptionContract/1',
          },
        },
      );
    });
    describe('when userErrors are returned', () => {
      it('throws an error', async () => {
        mockGraphQL(errorGraphQLResponses());

        const dunningTracker = await factories.dunningTracker.create({
          shop: TEST_SHOP,
          contractId:
            SubscriptionBillingAttemptSuccessWebhook.admin_graphql_api_subscription_contract_id,
          billingCycleIndex: 1,
          failureReason: 'CARD_EXPIRED',
        });

        vi.spyOn(job, 'getDunningTracker').mockResolvedValue(dunningTracker);

        expect(job.perform()).rejects.toThrowError(
          `Failed to reactivate failed subscription contract ${SubscriptionBillingAttemptSuccessWebhook.admin_graphql_api_subscription_contract_id}`,
        );
      });
    });
  });
});
