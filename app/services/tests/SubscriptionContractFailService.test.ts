import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SubscriptionContractFailMutation from '~/graphql/SubscriptionContractFailMutation';
import {SubscriptionContractFailService} from '../SubscriptionContractFailService';

const subscriptionContractId = 'gid://shopify/SubscriptionContract/1';
const shopDomain = 'shop-example.myshopify.com';

function defaultGraphQLResponses() {
  return {
    subscriptionContractFail: {
      data: {
        subscriptionContractFail: {
          contract: {id: subscriptionContractId},
          userErrors: [],
        },
      },
    },
  };
}

function invalidFieldsGraphQLResponses() {
  return {
    subscriptionContractFail: {
      data: {
        subscriptionContractFail: {
          contract: null,
          userErrors: [
            {
              field: ['subscriptionContractId'],
              message: 'Subscription contract is invalid',
            },
          ],
        },
      },
    },
  };
}

function invalidParamsGraphQLResponses() {
  return {
    SubscriptionContractFailMutation: {
      errors: [
        {
          message:
            'Variable $subscriptionContractId of type ID! was provided invalid value',
          locations: [
            {
              line: 25,
              column: 35,
            },
          ],
          extensions: {
            value: 'invalid-subscription-contract-id',
            problems: [
              {
                path: [],
                explanation:
                  "Invalid global id 'invalid-subscription-contract-id'",
                message: "Invalid global id 'invalid-subscription-contract-id'",
              },
            ],
          },
        },
      ],
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('SubscriptionContractFailService', () => {
  afterEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
  });

  describe('with a valid set of params', () => {
    it('fails a subscription contract', async () => {
      mockGraphQL(defaultGraphQLResponses());

      await new SubscriptionContractFailService(
        shopDomain,
        subscriptionContractId,
      ).run();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractFailMutation,
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
      mockGraphQL(invalidFieldsGraphQLResponses());

      const service = new SubscriptionContractFailService(
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow(
        'Failed to fail subscription via SubscriptionContractFail',
      );
    });

    it('throws an error for invalid field', async () => {
      mockGraphQL(invalidParamsGraphQLResponses());

      const service = new SubscriptionContractFailService(
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow();
    });
  });
});
