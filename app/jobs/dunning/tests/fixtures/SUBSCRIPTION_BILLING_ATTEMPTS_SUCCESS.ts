import type {SubscriptionBillingAttemptSuccess} from '~/types/webhooks';

export const SubscriptionBillingAttemptSuccessWebhook: SubscriptionBillingAttemptSuccess =
  {
    admin_graphql_api_id: 'gid://shopify/SubscriptionBillingAttempt/1',
    admin_graphql_api_order_id: 'gid://shopify/Order/1',
    admin_graphql_api_subscription_contract_id:
      'gid://shopify/SubscriptionContract/1',
    error_code: null,
    error_message: null,
    id: 1,
    idempotency_key: 'foo-bar-baz',
    order_id: 1,
    ready: true,
    subscription_contract_id: 1,
  };
