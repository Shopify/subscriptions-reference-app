import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {CustomerSendEmailJob, jobs, MerchantSendEmailJob} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.subscription_contracts.cancel';

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

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls customer and merchant email jobs on SUBSCRIPTION_CONTRACTS_CANCEL topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SUBSCRIPTION_CONTRACTS_CANCEL',
      payload: subscriptionContractPayload,
    });
    await action(ACTION_REQUEST);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new CustomerSendEmailJob({
        shop: TEST_SHOP,
        payload: {
          ...subscriptionContractPayload,
          emailTemplate: 'SUBSCRIPTION_CANCELED',
        },
      }),
    );

    expect(enqueueSpy).toHaveBeenCalledWith(
      new MerchantSendEmailJob({
        shop: TEST_SHOP,
        payload: {
          admin_graphql_api_id:
            subscriptionContractPayload.admin_graphql_api_id,
        },
      }),
    );
  });
});
