import type {SubscriptionBillingAttemptFailure} from '~/types/webhooks';

export const SubscriptionBillingAttemptInsufficientInventoryWebhook: SubscriptionBillingAttemptFailure =
  {
    admin_graphql_api_id: 'gid://shopify/SubscriptionBillingAttempt/1',
    admin_graphql_api_order_id: 'gid://shopify/Order/1',
    admin_graphql_api_subscription_contract_id:
      'gid://shopify/SubscriptionContract/1',
    error_code: "INSUFFICIENT_INVENTORY",
    error_message: "INSUFFICIENT_INVENTORY",
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
    error_code: "INVENTORY_ALLOCATIONS_NOT_FOUND",
    error_message: "INVENTORY_ALLOCATIONS_NOT_FOUND",
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
    error_code: "INSUFFICIENT_FUNDS",
    error_message: "INSUFFICIENT_FUNDS",
    id: 1,
    idempotency_key: 'foo-bar-baz',
    order_id: 1,
    ready: true,
    subscription_contract_id: 1,
  };
