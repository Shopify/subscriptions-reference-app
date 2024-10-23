import {mockShopifyServer} from '#/test-utils';
import {TEST_SHOP} from '#/constants';
import {afterAll, describe, expect, it, afterEach, vi} from 'vitest';
import OrderTagsAddMutation from '~/graphql/OrderTagsAddMutation';
import {AddOrderTagsService} from '../AddOrderTagsService';

function defaultGraphQLResponses() {
  return {
    tagsAdd: {
      data: {
        tagsAdd: {
          node: {
            id: 'gid://shopify/Order/1',
          },
          userErrors: [],
        },
      },
    },
  };
}

function errorGraphQLResponses() {
  return {
    tagsAdd: {
      data: {
        tagsAdd: {
          userErrors: [{message: 'Some error'}],
        },
      },
    },
  };
}

const shopDomain = TEST_SHOP;
const orderId = 'gid://shopify/Order/1';
const tags = ['Subscription', 'Subscription First Order'];

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('AddOrderTagsService', async () => {
  afterAll(async () => {
    vi.restoreAllMocks();
  });
  afterEach(async () => {
    graphQL.mockRestore();
  });

  describe('with a valid session', () => {
    it('adds tags to an order', async () => {
      mockGraphQL(defaultGraphQLResponses());

      await new AddOrderTagsService(shopDomain, orderId).run(tags);

      expect(graphQL).toHavePerformedGraphQLOperation(OrderTagsAddMutation, {
        variables: {
          id: orderId,
          tags: tags,
        },
      });
    });

    describe('when an error is returned by shopify', async () => {
      it('throws an error', async () => {
        mockGraphQL(errorGraphQLResponses());

        const service = new AddOrderTagsService(shopDomain, orderId);

        await expect(() => service.run(tags)).rejects.toThrow(
          'Failed to add tags to order in AddOrderTagsService',
        );
      });
    });
  });
});
