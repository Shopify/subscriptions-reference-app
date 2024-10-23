import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {CreateSellingPlanTranslationsJob, jobs} from '~/jobs';
import {TEST_SHOP} from '#/constants';
import {action} from '../webhooks.selling_plan_groups.create_or_update';

const ACTION_REQUEST = {
  request: new Request('https://app.com'),
  params: {},
  context: {},
};

const enqueueSpy = vi.spyOn(jobs, 'enqueue');
const {mockWebhook} = mockShopifyServer();

const sellingPlanGroupsPayload = {
  admin_graphql_api_id: 'gid://shopify/SellingPlanGroup/1',
  admin_graphql_api_app: 'gid://shopify/App/1111111111',
  id: 1,
  name: 'Plan 1',
  merchant_code: '123',
  options: [],
  selling_plans: [],
};

describe('when webhook action is triggered', () => {
  afterEach(async () => {
    vi.resetAllMocks();
  });

  it('calls CreateSellingPlanTranslationsJob on SELLING_PLAN_GROUPS_UPDATE topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SELLING_PLAN_GROUPS_UPDATE',
      payload: sellingPlanGroupsPayload,
    });
    await action(ACTION_REQUEST);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new CreateSellingPlanTranslationsJob({
        shop: TEST_SHOP,
        payload: sellingPlanGroupsPayload,
      }),
    );
  });

  it('calls CreateSellingPlanTranslationsJob on SELLING_PLAN_GROUPS_CREATE topic', async () => {
    mockWebhook({
      shop: TEST_SHOP,
      topic: 'SELLING_PLAN_GROUPS_CREATE',
      payload: sellingPlanGroupsPayload,
    });
    await action(ACTION_REQUEST);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new CreateSellingPlanTranslationsJob({
        shop: TEST_SHOP,
        payload: sellingPlanGroupsPayload,
      }),
    );
  });
});
