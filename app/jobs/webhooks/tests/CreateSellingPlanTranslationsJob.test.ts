import {describe, expect, it, vi, beforeEach} from 'vitest';
import {mockShopifyServer} from '#/test-utils';
import {CreateSellingPlanTranslationsJob} from '~/jobs';
import type {Jobs, Webhooks} from '~/types';
import {TEST_SHOP} from '#/constants';
import {
  SellingPlanGroupCreateWebhook,
  SellingPlanGroupCreateWebhookWithDifferentAppGid,
} from '~/jobs/webhooks/tests/fixtures/SELLING_PLAN_GROUP_CREATE_WEBHOOK';
import {createSellingPlanTranslations} from '~/models/SellingPlan/SellingPlan.server';
import GetShopLocales from '~/graphql/ShopLocalesQuery';
import SellingPlanTranslations from '~/graphql/SellingPlanTranslationsQuery';

vi.mock('../../../../config', async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    env: {
      ...original.env,
      appGID: 'gid://shopify/App/1111111111',
    },
  };
});

vi.mock('~/models/SellingPlan/SellingPlan.server', async () => {
  return {
    createSellingPlanTranslations: vi.fn().mockResolvedValue(undefined),
  };
});

const mockValidResponses = [
  {
    getShopLocales: {
      data: {
        shopLocales: [
          {locale: 'en', primary: true, published: true},
          {locale: 'de', primary: false, published: true},
        ],
      },
    },
  },
  {
    Shop: {
      data: {
        shop: {
          id: 'gid://shopify/Shop/1',
          primaryDomain: {
            url: TEST_SHOP,
          },
          currencyCode: 'CAD',
        },
      },
    },
  },
  {
    SellingPlanTranslations: {
      data: {
        sellingPlanGroup: {
          sellingPlans: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/SellingPlan/1',
                  deliveryPolicy: {
                    intervalCount: 1,
                    interval: 'MONTH',
                  },
                  pricingPolicies: [
                    {
                      adjustmentValue: {
                        amount: 5.0,
                      },
                      adjustmentType: 'PRICE',
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  },
];

describe('CreateSellingPlanTranslationsJob#perform', () => {
  const {graphQL, sequentiallyMockGraphQL} = mockShopifyServer();

  const task: Jobs.Parameters<Webhooks.SellingPlanGroups> = {
    shop: TEST_SHOP,
    payload: SellingPlanGroupCreateWebhook,
  };
  const job = new CreateSellingPlanTranslationsJob(task);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('terminates when data field is missing in selling plan group query', async () => {
    sequentiallyMockGraphQL([
      {
        getShopLocales: {
          data: {
            shopLocales: [
              {locale: 'en', primary: true, published: true},
              {locale: 'de', primary: false, published: true},
            ],
          },
        },
      },
      {
        Shop: {
          data: {
            shop: {
              id: 'gid://shopify/Shop/1',
              primaryDomain: {
                url: TEST_SHOP,
              },
              currencyCode: 'CAD',
            },
          },
        },
      },
      {
        SellingPlanTranslations: {
          notData: {},
        },
      },
    ]);

    await expect(job.perform()).resolves.toBeUndefined();
  });

  it('calls the createSellingPlanTranslations mutation with valid params', async () => {
    sequentiallyMockGraphQL(mockValidResponses);
    await job.perform();

    expect(createSellingPlanTranslations).toHaveBeenCalledWith(
      graphQL,
      [
        {
          id: 'gid://shopify/SellingPlan/1',
          pricingPolicies: [
            {
              adjustmentType: 'PRICE',
              adjustmentValue: {
                amount: 5,
              },
            },
          ],
          deliveryPolicy: {
            interval: 'MONTH',
            intervalCount: 1,
          },
        },
      ],
      [{locale: 'de', primary: false, published: true}],
      'CAD',
    );
  });

  it('returns if selling plan group event is not from subscriptions app', async () => {
    const task: Jobs.Parameters<Webhooks.SellingPlanGroups> = {
      shop: TEST_SHOP,
      payload: SellingPlanGroupCreateWebhookWithDifferentAppGid,
    };
    const job = new CreateSellingPlanTranslationsJob(task);

    await job.perform();

    expect(graphQL).not.toHavePerformedGraphQLOperation(GetShopLocales);
    expect(graphQL).not.toHavePerformedGraphQLOperation(
      SellingPlanTranslations,
    );
  });
});
