import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it} from 'vitest';
import {TEST_SHOP} from '#/constants';
import SubscriptionBillingAttemptQuery from '~/graphql/SubscriptionBillingAttemptQuery';
import {
  findSubscriptionBillingAttempt,
  getNextBillingCycleDates,
} from '../SubscriptionBillingAttempt.server';
import type {SellingPlanInterval} from 'types/admin.types';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('SubscriptionBillingAttempt', () => {
  afterEach(async () => {
    graphQL.mockRestore();
  });

  describe('findSubscriptionBillingAttempt', () => {
    it('returns a billing attempt', async () => {
      mockGraphQL({
        SubscriptionBillingAttempt: {
          data: {
            subscriptionBillingAttempt: {
              id: 'gid://shopify/SubscriptionBillingAttempt/1',
              originTime: '2023-11-13T16:58:03Z',
              subscriptionContract: {
                id: 'gid://shopify/SubscriptionContract/1',
              },
            },
          },
        },
      });

      const billingAttempt = await findSubscriptionBillingAttempt(
        TEST_SHOP,
        'gid://shopify/SubscriptionBillingAttempt/1',
      );

      expect(billingAttempt.id).toEqual(
        'gid://shopify/SubscriptionBillingAttempt/1',
      );
      expect(billingAttempt.originTime).toEqual('2023-11-13T16:58:03Z');
      expect(billingAttempt.subscriptionContract.id).toEqual(
        'gid://shopify/SubscriptionContract/1',
      );

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionBillingAttemptQuery,
        {
          variables: {
            billingAttemptId: 'gid://shopify/SubscriptionBillingAttempt/1',
          },
        },
      );
    });

    it('throws if it does not exist', async () => {
      mockGraphQL({
        SubscriptionBillingAttempt: {
          data: {
            subscriptionBillingAttempt: null,
          },
        },
      });

      expect(
        findSubscriptionBillingAttempt(
          TEST_SHOP,
          'gid://shopify/SubscriptionBillingAttempt/2',
        ),
      ).rejects.toThrowError(
        'Failed to find SubscriptionBillingAttempt with id: gid://shopify/SubscriptionBillingAttempt/2',
      );
    });
  });

  describe('getNextBillingCycleDates', () => {
    it('returns the next billing cycle dates', async () => {
      mockGraphQL({
        SubscriptionBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: [
                {
                  node: {
                    billingAttemptExpectedDate: '2023-11-13T16:58:03Z',
                    skipped: false,
                    billingAttempts: {
                      edges: [],
                    },
                  },
                },
                {
                  node: {
                    billingAttemptExpectedDate: '2023-11-20T16:58:03Z',
                    skipped: false,
                    billingAttempts: {
                      edges: [],
                    },
                  },
                },
              ],
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        },
      });

      const result = await getNextBillingCycleDates(
        graphQL,
        '1',
        2,
        'WEEK' as SellingPlanInterval,
        2,
      );

      expect(
        result.upcomingBillingCycles[0].billingAttemptExpectedDate,
      ).toEqual('2023-11-13T16:58:03Z');
      expect(result.upcomingBillingCycles[0].skipped).toEqual(false);
      expect(
        result.upcomingBillingCycles[1].billingAttemptExpectedDate,
      ).toEqual('2023-11-20T16:58:03Z');
      expect(result.upcomingBillingCycles[1].skipped).toEqual(false);
    });

    it('omits billing cycles that have an order created', async () => {
      mockGraphQL({
        SubscriptionBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: [
                {
                  node: {
                    billingAttemptExpectedDate: '2023-11-13T16:58:03Z',
                    skipped: false,
                    billingAttempts: {
                      edges: [
                        {
                          node: {
                            order: {
                              id: 'gid://shopify/Order/1',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  node: {
                    billingAttemptExpectedDate: '2023-11-20T16:58:03Z',
                    skipped: false,
                    billingAttempts: {
                      edges: [],
                    },
                  },
                },
              ],
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        },
      });

      const result = await getNextBillingCycleDates(
        graphQL,
        '1',
        2,
        'WEEK' as SellingPlanInterval,
        2,
      );

      expect(result.upcomingBillingCycles).toHaveLength(1);

      expect(
        result.upcomingBillingCycles[0].billingAttemptExpectedDate,
      ).toEqual('2023-11-20T16:58:03Z');
    });

    it('throws if data not available', async () => {
      mockGraphQL({
        SubscriptionBillingCycles: {
          data: null,
        },
      });

      expect(
        getNextBillingCycleDates(
          graphQL,
          '1',
          2,
          'WEEK' as SellingPlanInterval,
          2,
        ),
      ).rejects.toThrowError('Failed to find SubscriptionBillingCycles');
    });
  });
});
