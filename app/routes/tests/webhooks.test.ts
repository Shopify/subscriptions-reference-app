import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {action} from '~/routes/webhooks';
import {TEST_SHOP} from '#/constants';
import {jobs, DeleteBillingScheduleJob} from '~/jobs';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const {mockWebhook} = mockShopifyServer();
const enqueueSpy = vi.spyOn(jobs, 'enqueue');

const subscriptionContractPayload = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  admin_graphql_api_origin_order_id: 'gid://shopify/Order/1',
};

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

const subscriptionBillingCyclePayload = {
  subscription_contract_id: '1',
  cycle_index: 1,
};

const sellingPlanGroupsPayload = {
  admin_graphql_api_id: 'gid://shopify/SellingPlanGroup/1',
  admin_graphql_api_app: 'gid://shopify/App/1111111111',
  id: 1,
  name: 'Plan 1',
  merchant_code: '123',
  options: [],
  selling_plans: [],
};

vi.mock('~/jobs', async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    jobs: {
      enqueue: vi.fn(),
    },
  };
});

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls DeleteBillingScheduleJob on SHOP_REDACT topic', async () => {
    const shopRedactPayload = {
      shop_id: 1,
      shop_domain: TEST_SHOP,
    };
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SHOP_REDACT',
      payload: shopRedactPayload,
    });
    const response = await action(ACTION_REQUEST);

    expect(response.status).equal(200);
    expect(enqueueSpy).toHaveBeenCalledWith(
      new DeleteBillingScheduleJob({
        shop: TEST_SHOP,
        payload: shopRedactPayload,
      }),
    );
  });

  it('returns 200 no customer data stored response on CUSTOMERS_DATA_REQUEST topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'CUSTOMERS_DATA_REQUEST',
      payload: {},
    });
    const response = await action(ACTION_REQUEST);

    expect(response.status).equal(200);
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it('returns 200 no customer data stored response on CUSTOMERS_REDACT topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'CUSTOMERS_REDACT',
      payload: {},
    });
    const response = await action(ACTION_REQUEST);
    expect(response.status).equal(200);
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  describe('legacy topics', () => {
    const topicPayloads = {
      SELLING_PLAN_GROUPS_UPDATE: sellingPlanGroupsPayload,
      SELLING_PLAN_GROUPS_CREATE: sellingPlanGroupsPayload,
      SUBSCRIPTION_CONTRACTS_CREATE: subscriptionContractPayload,
      SUBSCRIPTION_CONTRACTS_ACTIVATE: subscriptionContractPayload,
      SUBSCRIPTION_CONTRACTS_PAUSE: subscriptionContractPayload,
      SUBSCRIPTION_CONTRACTS_CANCEL: subscriptionContractPayload,
      SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS: subscriptionBillingAttemptPayload,
      SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE: subscriptionBillingAttemptPayload,
      APP_UNINSTALLED: {},
      SUBSCRIPTION_BILLING_CYCLES_SKIP: subscriptionBillingCyclePayload,
    };
    it.each(Object.entries(topicPayloads))(
      'returns 200 and skips processing for %s topic',
      async (topic, payload) => {
        mockWebhook({
          shop: TEST_SHOP,
          topic,
          payload,
        });
        const response = await action(ACTION_REQUEST);
        expect(response.status).toBe(200);
        expect(enqueueSpy).not.toHaveBeenCalled();
      },
    );
  });
});
