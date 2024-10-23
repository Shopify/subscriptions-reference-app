import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.customer_redact';

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
});
