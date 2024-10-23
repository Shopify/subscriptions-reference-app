import {mockShopifyServer} from '#/test-utils';
import {describe, expect, afterEach, it} from 'vitest';
import SubscriptionContractCancelMutation from '~/graphql/SubscriptionContractCancelMutation';
import {SubscriptionContractCancelService} from '../SubscriptionContractCancelService';

function defaultGraphQLResponses() {
  return {
    SubscriptionContractCancel: {
      data: {
        subscriptionContractCancel: {
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
    SubscriptionContractCancel: {
      data: {
        subscriptionContractCancel: {
          contract: {
            id: 'gid://shopify/SubscriptionContract/1',
          },
          userErrors: [
            {
              field: 'contractId',
              message: 'Cannot cancel contract',
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

describe('SubscriptionContractCancelService', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  describe('with a valid set of params', () => {
    it('cancels a subscription contract', async () => {
      mockGraphQL(defaultGraphQLResponses());

      await new SubscriptionContractCancelService(
        graphQL,
        shopDomain,
        subscriptionContractId,
      ).run();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractCancelMutation,
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

      const service = new SubscriptionContractCancelService(
        graphQL,
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow(
        'Failed to cancel subscription via SubscriptionContractCancel',
      );
    });

    it('throws an error for invalid field', async () => {
      mockGraphQL(errorGraphQLResponses);

      const service = new SubscriptionContractCancelService(
        graphQL,
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow();
    });
  });
});
