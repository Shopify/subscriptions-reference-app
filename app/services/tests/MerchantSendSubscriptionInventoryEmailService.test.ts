import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it} from 'vitest';
import {MerchantSendSubscriptionInventoryEmailService} from '../MerchantSendSubscriptionInventoryEmailService';

const shopDomain = 'shop-example.myshopify.com';

function defaultGraphQLResponses() {
  return {
    MerchantSendSubscriptionInventoryEmail: {
      data: {
        merchantSendSubscriptionInventoryFailureEmail: {
          success: true,
          userErrors: [],
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('MerchantSendSubscriptionInventoryEmail', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });

  describe('run', async () => {
    it('returns true', async () => {
      mockGraphQL(defaultGraphQLResponses());

      const result =
        await new MerchantSendSubscriptionInventoryEmailService().run(
          shopDomain,
        );

      expect(result).toBe(true);
    });
  });
});
