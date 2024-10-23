import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {CustomerSendEmailJob, jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.subscription_billing_cycles.skip';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const enqueueSpy = vi.spyOn(jobs, 'enqueue');
const {mockWebhook} = mockShopifyServer();

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls CustomerSendEmailJob on SUBSCRIPTION_BILLING_CYCLES_SKIP topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SUBSCRIPTION_BILLING_CYCLES_SKIP',
      payload: {
        subscription_contract_id: '1',
        cycle_index: 1,
      },
    });
    await action(ACTION_REQUEST);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new CustomerSendEmailJob({
        shop: TEST_SHOP,
        payload: {
          admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
          cycle_index: 1,
          emailTemplate: 'SUBSCRIPTION_SKIPPED',
        },
      }),
    );
  });
});
