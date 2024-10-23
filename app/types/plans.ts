import type {Money, PaginationInfo, RecurringPolicy} from '.';

export interface SellingPlanGroupListItem {
  id: string;
  merchantCode: string;
  productsCount?: number;
  productVariantsCount?: number;
  products?: SellingPlanGroupListItemProduct[];
  sellingPlans: SellingPlanGroupListItemSellingPlan[];
  sellingPlansPageInfo: PaginationInfo;
}

export interface SellingPlanGroupListItemSellingPlan {
  id?: string;
  pricingPolicies?: SellingPlanPricingPolicy[];
  deliveryPolicy: RecurringPolicy;
}

export interface SellingPlanGroupListItemProduct {
  id: string;
  title: string;
}

export const SellingPlanAdjustment = {
  Percentage: 'PERCENTAGE',
  Fixed: 'FIXED_AMOUNT',
  Price: 'PRICE',
} as const;

export type SellingPlanAdjustmentType =
  (typeof SellingPlanAdjustment)[keyof typeof SellingPlanAdjustment];

export type SellingPlanAdjustmentValue = Percentage | Money;

export interface Percentage {
  percentage: number;
}

export interface SellingPlanPricingPolicy {
  adjustmentType: SellingPlanAdjustmentType;
  adjustmentValue: SellingPlanAdjustmentValue;
}
