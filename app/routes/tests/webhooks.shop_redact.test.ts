import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DeleteBillingScheduleJob, jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.shop_redact';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const enqueueSpy = vi.spyOn(jobs, 'enqueue');
const {mockWebhook} = mockShopifyServer();

describe('when SHOP_REDACT webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls DeleteBillingScheduleJob on APP_UNINSTALLED topic', async () => {
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
});
