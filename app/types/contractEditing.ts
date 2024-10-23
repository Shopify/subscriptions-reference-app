import type {SellingPlanPricingPolicyAdjustmentType} from 'types/admin.types';
import type {PricingPolicyInput} from '~/routes/app.contracts.$id.edit/validator';
import type {
  DeliveryMethod,
  Money,
  RecurringPolicy,
  SubscriptionContractStatusType,
} from '.';
import type {PriceBreakdown, SubscriptionDeliveryMethod} from './contracts';
export interface SubscriptionContractEditDetails {
  id: string;
  status: SubscriptionContractStatusType;
  currencyCode: string;
  lines: SubscriptionContractEditLine[];
  deliveryPolicy: RecurringPolicy;
  deliveryMethod?: SubscriptionDeliveryMethod | null;
  deliveryPrice: Money;
  priceBreakdownEstimate?: PriceBreakdown | null;
}

export interface SubscriptionContractEditLine {
  id: string;
  title: string;
  variantTitle?: string | null;
  quantity: number;
  productId?: string | null;
  variantId?: string | null;
  currentPrice: Money;
  lineDiscountedPrice: Money;
  variantImage?: {
    altText?: string | null;
    url?: string | null;
  } | null;
  currentOneTimePurchasePrice?: number;
  pricingPolicy?: ContractEditPricingPolicy | null;
}

export interface ContractEditPricingPolicy {
  basePrice: Money;
  cycleDiscounts: ContractEditCycleDiscount[];
}

export interface ContractEditCycleDiscount {
  computedPrice: Money;
  afterCycle: number;
  adjustmentType: SellingPlanPricingPolicyAdjustmentType;
  adjustmentValue: Money | {percentage: number};
}

export interface SubscriptionLineInput {
  productVariantId: string;
  quantity: number;
  currentPrice: number;
  pricingPolicy?: PricingPolicyInput;
  currentOneTimePurchasePrice?: string;
}

export interface UpdateLineInput {
  quantity?: number;
  currentPrice?: number;
  pricingPolicy?: PricingPolicyInput;
}

export interface SubscriptionDraftUpdateInput {
  deliveryPolicy?: RecurringPolicy;
  billingPolicy?: RecurringPolicy;
  deliveryMethod?: DeliveryMethod;
}

export interface SubscriptionContractDraftDiscount {
  id: string;
  validForAllLines: boolean;
  entitledLines: {
    id: string;
  }[];
}
