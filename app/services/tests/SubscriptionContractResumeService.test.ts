import {mockShopifyServer} from '#/test-utils';
import {describe, expect, afterEach, it} from 'vitest';
import SubscriptionContractResumeMutation from '~/graphql/SubscriptionContractResumeMutation';
import {SubscriptionContractResumeService} from '../SubscriptionContractResumeService';

function defaultGraphQLResponses() {
  return {
    SubscriptionContractResume: {
      data: {
        subscriptionContractActivate: {
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
    SubscriptionContractResume: {
      data: {
        subscriptionContractActivate: {
          contract: {
            id: 'gid://shopify/SubscriptionContract/1',
          },
          userErrors: [
            {
              field: 'subscriptionContractId',
              message: 'Cannot resume contract',
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

describe('SubscriptionContractResumeService', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  describe('when mutation is successful', () => {
    it('resumes a subscription contract', async () => {
      mockGraphQL(defaultGraphQLResponses());

      await new SubscriptionContractResumeService(
        graphQL,
        shopDomain,
        subscriptionContractId,
      ).run();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractResumeMutation,
        {
          variables: {
            subscriptionContractId,
          },
        },
      );
    });
  });

  describe('when mutation fails', () => {
    it('throws an error for invalid field', async () => {
      mockGraphQL(errorGraphQLResponses());

      const service = new SubscriptionContractResumeService(
        graphQL,
        shopDomain,
        'invalid-subscription-contract-id',
      );

      await expect(() => service.run()).rejects.toThrow(
        'Failed to resume subscription via SubscriptionContractResumeService',
      );
    });
  });
});
