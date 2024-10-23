import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {CustomerSendEmailJob, jobs, TagSubscriptionOrderJob} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.subscription_contracts.create';
import {FIRST_ORDER_TAGS} from '~/jobs/tags/constants';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const enqueueSpy = vi.spyOn(jobs, 'enqueue');
const {mockWebhook} = mockShopifyServer();

const subscriptionContractPayload = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  admin_graphql_api_origin_order_id: 'gid://shopify/Order/1',
};

const subscriptionContractPayloadNullOrder = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  admin_graphql_api_origin_order_id: null,
};

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  describe('when topic is SUBSCRIPTION_CONTRACTS_CREATE', () => {
    describe('event is from checkout', () => {
      it('calls both customer email and tag subscription order jobs', async () => {
        mockWebhook({
          shop: TEST_SHOP,
          topic: 'SUBSCRIPTION_CONTRACTS_CREATE',
          payload: subscriptionContractPayload,
        });
        await action(ACTION_REQUEST);

        expect(enqueueSpy).toHaveBeenCalledWith(
          new CustomerSendEmailJob({
            shop: TEST_SHOP,
            payload: {
              ...subscriptionContractPayload,
              emailTemplate: 'NEW_SUBSCRIPTION',
            },
          }),
        );

        expect(enqueueSpy).toHaveBeenCalledWith(
          new TagSubscriptionOrderJob({
            shop: TEST_SHOP,
            payload: {
              orderId: 'gid://shopify/Order/1',
              tags: FIRST_ORDER_TAGS,
            },
          }),
        );
      });
    });

    describe('event is not from checkout', () => {
      it('only calls tag subscription order jobs', async () => {
        mockWebhook({
          shop: TEST_SHOP,
          topic: 'SUBSCRIPTION_CONTRACTS_CREATE',
          payload: subscriptionContractPayloadNullOrder,
        });
        await action(ACTION_REQUEST);

        expect(enqueueSpy).toHaveBeenCalledOnce();
        expect(enqueueSpy).toHaveBeenCalledWith(
          new TagSubscriptionOrderJob({
            shop: TEST_SHOP,
            payload: {
              orderId: null,
              tags: FIRST_ORDER_TAGS,
            },
          }),
        );
      });
    });
  });
});
