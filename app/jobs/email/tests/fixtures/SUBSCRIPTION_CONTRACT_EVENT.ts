import type {SubscriptionContractEvent} from '~/types/webhooks';

export const newSubscriptionContractEvent: SubscriptionContractEvent = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  emailTemplate: 'NEW_SUBSCRIPTION',
};

export const cancelledSubscriptionContractEvent: SubscriptionContractEvent = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  emailTemplate: 'SUBSCRIPTION_CANCELED',
};

export const pausedSubscriptionContractEvent: SubscriptionContractEvent = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  emailTemplate: 'SUBSCRIPTION_PAUSED',
};

export const resumedSubscriptionContractEvent: SubscriptionContractEvent = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  admin_graphql_api_customer_id: 'gid://shopify/Customer/1',
  emailTemplate: 'SUBSCRIPTION_RESUMED',
};
