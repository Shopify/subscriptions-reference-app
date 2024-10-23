import type {SellingPlanGroups} from '~/types/webhooks';

export const SellingPlanGroupCreateWebhook: SellingPlanGroups = {
  admin_graphql_api_id: 'gid://shopify/SellingPlanGroup/1',
  admin_graphql_api_app: 'gid://shopify/App/1111111111',
  id: 1,
  name: 'Plan 1',
  merchant_code: '123',
  options: [],
  selling_plans: [
    {
      name: '5 OFF',
      description: 'get 5 dollars off',
      delivery_policy: {
        interval_count: 1,
        interval: 'month',
      },
      billing_policy: {
        interval_count: 1,
        interval: 'month',
        max_cycles: 3,
        min_cycles: 1,
      },
      pricing_policies: [
        {
          adjustment_value: '5.0',
          adjustment_type: 'price',
        },
      ],
    },
  ],
};

export const SellingPlanGroupCreateWebhookWithDifferentAppGid: SellingPlanGroups =
  {
    admin_graphql_api_id: 'gid://shopify/SellingPlanGroup/1',
    admin_graphql_api_app: 'gid://shopify/App/2222222222',
    id: 1,
    name: 'Plan 1',
    merchant_code: '123',
    options: [],
    selling_plans: [
      {
        name: '5 OFF',
        description: 'get 5 dollars off',
        delivery_policy: {
          interval_count: 1,
          interval: 'month',
        },
        billing_policy: {
          interval_count: 1,
          interval: 'month',
          max_cycles: 3,
          min_cycles: 1,
        },
        pricing_policies: [
          {
            adjustment_value: '5.0',
            adjustment_type: 'price',
          },
        ],
      },
    ],
  };
