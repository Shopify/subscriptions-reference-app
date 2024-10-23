import {mockShopifyServer} from '#/test-utils';
import {describe, expect, afterEach, it} from 'vitest';
import SubscriptionContractPauseMutation from '~/graphql/SubscriptionContractPauseMutation';
import {SubscriptionContractPauseService} from '../SubscriptionContractPauseService';

function defaultGraphQLResponses() {
  return {
    SubscriptionContractPause: {
      data: {
        subscriptionContractPause: {
          contract: {
            id: 'gid://shopify/SubscriptionContract/1',
          },
          userErrors: [],
        },
      },
    },
  };
}

function errorGraphQLResponses() {
  return {
    SubscriptionContractPause: {
      data: {
        subscriptionContractPause: {
          contract: {
            id: 'gid://shopify/SubscriptionContract/1',
          },
          userErrors: [
            {
              field: 'subscriptionContractId',
              message: 'Cannot pause contract',
            },
          ],
        },
      },
    },
  };
}

const subscriptionContractId = 'gid://shopify/SubscriptionContract/1';
const shopDomain = 'shop-example.myshopify.com';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('SubscriptionContractPauseService', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  describe('with a valid set of params', () => {
    it('fails a subscription contract', async () => {
      mockGraphQL(defaultGraphQLResponses());

      await new SubscriptionContractPauseService(
        graphQL,
        shopDomain,
        subscriptionContractId,
      ).run();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractPauseMutation,
        {
          variables: {
            subscriptionContractId,
          },
        },
      );
    });
  });

  describe('with an invalid set of params', () => {
    it('throws an error for invalid field', async () => {
      mockGraphQL(errorGraphQLResponses());

      const service = new SubscriptionContractPauseService(
        graphQL,
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow(
        'Failed to cancel subscription via SubscriptionContractPause',
      );
    });

    it('throws an error for invalid field', async () => {
      mockGraphQL(errorGraphQLResponses());

      const service = new SubscriptionContractPauseService(
        graphQL,
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow();
    });
  });
});
