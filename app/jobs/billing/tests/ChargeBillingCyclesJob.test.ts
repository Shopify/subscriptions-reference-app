import {mockShopifyServer} from '#/test-utils';
import type {Jobs} from '~/types';
import {TEST_SHOP} from '#/constants';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ChargeBillingCyclesMutation from '~/graphql/ChargeBillingCyclesMutation';
import {ChargeBillingCyclesJob} from '~/jobs/billing/ChargeBillingCyclesJob';
import {SessionNotFoundError} from '@shopify/shopify-app-remix/server';
import {unauthenticated} from '~/shopify.server';

function defaultGraphQLResponses() {
  return {
    ChargeBillingCycles: {
      data: {
        subscriptionBillingCycleBulkCharge: {
          job: {id: '123'},
          userErrors: [],
        },
      },
    },
  };
}

function errorGraphQLResponses() {
  return {
    ChargeBillingCycles: {
      data: {
        subscriptionBillingCycleBulkCharge: {
          job: null,
          userErrors: ['Start date cannot be after end date'],
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('ChargeBillingCyclesJob', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });

  describe('with a valid session', () => {
    it('sends the mutation', async () => {
      mockGraphQL(defaultGraphQLResponses());

      const task: Jobs.Parameters<Jobs.ChargeBillingCyclesPayload> = {
        shop: TEST_SHOP,
        payload: {
          startDate: '2023-07-13T12:00:00Z',
          endDate: '2023-07-14T12:00:00Z',
        },
      };

      const job = new ChargeBillingCyclesJob(task);

      await job.perform();

      expect(graphQL).toHavePerformedGraphQLOperation(
        ChargeBillingCyclesMutation,
        {
          variables: {
            startDate: '2023-07-13T12:00:00Z',
            endDate: '2023-07-14T12:00:00Z',
            contractStatus: ['ACTIVE'],
            billingCycleStatus: ['UNBILLED'],
            billingAttemptStatus: 'NO_ATTEMPT',
          },
        },
      );
    });
  });

  describe('with errors returned', () => {
    it('throws an error', async () => {
      mockGraphQL(errorGraphQLResponses());

      const task: Jobs.Parameters<Jobs.ChargeBillingCyclesPayload> = {
        shop: TEST_SHOP,
        payload: {
          startDate: '2023-07-14T12:00:00Z',
          endDate: '2023-07-13T12:00:00Z',
        },
      };

      const job = new ChargeBillingCyclesJob(task);

      await expect(() => job.perform()).rejects.toThrowError(
        'Failed to process ChargeBillingCyclesJob',
      );
    });
  });

  describe('when admin context cannot be created', () => {
    it('throws an error', async () => {
      vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
        admin: {
          graphql: vi.fn().mockImplementation(() => {
            throw new SessionNotFoundError(
              `Could not find a session for shop ${TEST_SHOP}`,
            );
          }),
        },
      } as any);

      const params: Jobs.Parameters<Jobs.ChargeBillingCyclesPayload> = {
        shop: TEST_SHOP,
        payload: {
          startDate: '2023-07-13T12:00:00Z',
          endDate: '2023-07-14T12:00:00Z',
        },
      };
      const job = new ChargeBillingCyclesJob(params);

      await expect(() => job.perform()).rejects.toThrowError(
        'Could not find a session for shop test-shop.myshopify.com',
      );
    });
  });
});
