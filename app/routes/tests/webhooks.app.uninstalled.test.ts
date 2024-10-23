import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DisableShopJob, jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.app.uninstalled';

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

  it('calls DisableShopJob on APP_UNINSTALLED topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'APP_UNINSTALLED',
      payload: {},
    });
    await action(ACTION_REQUEST);
    expect(enqueueSpy).toHaveBeenCalledWith(
      new DisableShopJob({
        shop: TEST_SHOP,
        payload: {},
      }),
    );
  });
});
