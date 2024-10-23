import type {CustomerEmailTemplateNameType} from '~/services/CustomerSendEmailService';

export enum SubscriptionContractStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Expired = 'expired',
  Failed = 'failed',
  Paused = 'paused',
  Stale = 'stale',
}

export const SubscriptionBillingAttemptErrorCode = {
  InsufficientInventory: 'insufficient_inventory',
  InventoryAllocationsNotFound: 'inventory_allocations_not_found',
} as const;

export type SubscriptionBillingAttemptErrorCodeType =
  (typeof SubscriptionBillingAttemptErrorCode)[keyof typeof SubscriptionBillingAttemptErrorCode];

interface BillingPolicy {
  interval_count: number;
  interval: string;
  max_cycles: number | null;
  min_cycles: number | null;
}

interface DeliveryPolicy {
  interval_count: number;
  interval: string;
}

export interface PricingPolicy {
  adjustment_type: string;
  adjustment_value: string;
}

export interface SubscriptionContractsCreate {
  admin_graphql_api_customer_id: string;
  admin_graphql_api_id: string;
  admin_graphql_api_origin_order_id: string | null;
  billing_policy: BillingPolicy;
  currency_code: string;
  customer_id: number;
  delivery_policy: DeliveryPolicy;
  id: number;
  origin_order_id: number | null;
  revision_id: number;
  status: SubscriptionContractStatus;
}

export interface SubscriptionBillingAttemptFailure {
  id: number;
  admin_graphql_api_id: string;
  idempotency_key: string;
  order_id: number | null;
  admin_graphql_api_order_id: string | null;
  subscription_contract_id: number;
  admin_graphql_api_subscription_contract_id: string;
  ready: boolean;
  error_message: string;
  error_code: string;
}

export interface SubscriptionBillingAttemptSuccess {
  id: number;
  admin_graphql_api_id: string;
  idempotency_key: string;
  order_id: number | null;
  admin_graphql_api_order_id: string | null;
  subscription_contract_id: number;
  admin_graphql_api_subscription_contract_id: string;
  ready: boolean;
  error_message: string | null;
  error_code: string | null;
}

export interface SubscriptionContractsSkipBillingCycle {
  subscription_contract_id: string;
  cycle_start_at: Date;
  cycle_end_at: Date;
  cycle_index: number;
  contract_edit: null;
  billing_attempt_expected_date: Date;
  skipped: boolean;
  edited: boolean;
}

type SubscriptionContractStatusType =
  (typeof SubscriptionContractStatus)[keyof typeof SubscriptionContractStatus];

export interface SubscriptionContractStatusChange {
  admin_graphql_api_id: string;
  id: number;
  billing_policy: {
    interval: string;
    interval_count: number;
    min_cycles: number | null;
    max_cycles: number | null;
  };
  currency_code: string;
  customer_id: number;
  admin_graphql_api_customer_id: string;
  delivery_policy: {
    interval: string;
    interval_count: number;
  };
  status: SubscriptionContractStatusType;
  admin_graphql_api_origin_order_id: string;
  origin_order_id: number;
  revision_id: number;
}

export interface ShopRedact {
  shop_id: number;
  shop_domain: string;
}

export interface SellingPlanGroups {
  admin_graphql_api_id: string;
  admin_graphql_api_app: string | null;
  id: number;
  name: string;
  merchant_code: string;
  options: string[];
  selling_plans: SellingPlanDetails[];
}

export interface SellingPlanDetails {
  name: string;
  description: string;
  delivery_policy: DeliveryPolicy;
  billing_policy: BillingPolicy;
  pricing_policies: PricingPolicy[];
}

export interface SubscriptionContractEvent {
  admin_graphql_api_id: string;
  emailTemplate: CustomerEmailTemplateNameType;
  admin_graphql_api_customer_id?: string;
  cycle_index?: number;
}

export interface SubscriptionContractId {
  admin_graphql_api_id: string;
}
