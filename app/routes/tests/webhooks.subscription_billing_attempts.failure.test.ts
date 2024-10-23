import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DunningStartJob, jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.subscription_billing_attempts.failure';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const enqueueSpy = vi.spyOn(jobs, 'enqueue');
const {mockWebhook} = mockShopifyServer();

const subscriptionBillingAttemptPayload = {
  id: 1,
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  idempotency_key: '1234',
  order_id: 1,
  admin_graphql_api_order_id: 'gid://shopify/Order/1',
  subscription_contract_id: 1,
  admin_graphql_api_subscription_contract_id:
    'gid://shopify/SubscriptionContract/1',
  ready: true,
  error_message: 'an error',
  error_code: '1',
};

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls DunningStartJob on SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE',
      payload: subscriptionBillingAttemptPayload,
    });
    await action(ACTION_REQUEST);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new DunningStartJob({
        shop: TEST_SHOP,
        payload: subscriptionBillingAttemptPayload,
      }),
    );
  });
});
