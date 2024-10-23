import type {SubscriptionBillingAttemptFailure} from '~/types/webhooks';

export const SubscriptionBillingAttemptInsufficientInventoryWebhook: SubscriptionBillingAttemptFailure =
  {
    admin_graphql_api_id: 'gid://shopify/SubscriptionBillingAttempt/1',
    admin_graphql_api_order_id: 'gid://shopify/Order/1',
    admin_graphql_api_subscription_contract_id:
      'gid://shopify/SubscriptionContract/1',
    error_code: 'insufficient_inventory',
    error_message: 'insufficient_inventory',
    id: 1,
    idempotency_key: 'foo-bar-baz',
    order_id: 1,
    ready: true,
    subscription_contract_id: 1,
  };

export const SubscriptionBillingAttemptInventoryAllocationsNotFoundWebhook: SubscriptionBillingAttemptFailure =
  {
    admin_graphql_api_id: 'gid://shopify/SubscriptionBillingAttempt/1',
    admin_graphql_api_order_id: 'gid://shopify/Order/1',
    admin_graphql_api_subscription_contract_id:
      'gid://shopify/SubscriptionContract/1',
    error_code: 'inventory_allocations_not_found',
    error_message: 'inventory_allocations_not_found',
    id: 1,
    idempotency_key: 'foo-bar-baz',
    order_id: 1,
    ready: true,
    subscription_contract_id: 1,
  };

export const SubscriptionBillingAttemptInsufficientFundsWebhook: SubscriptionBillingAttemptFailure =
  {
    admin_graphql_api_id: 'gid://shopify/SubscriptionBillingAttempt/1',
    admin_graphql_api_order_id: 'gid://shopify/Order/1',
    admin_graphql_api_subscription_contract_id:
      'gid://shopify/SubscriptionContract/1',
    error_code: 'insufficient_funds',
    error_message: 'insufficient_funds',
    id: 1,
    idempotency_key: 'foo-bar-baz',
    order_id: 1,
    ready: true,
    subscription_contract_id: 1,
  };
