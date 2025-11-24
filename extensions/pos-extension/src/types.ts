import {
  CurrencyCode,
  SellingPlanPricingPolicyAdjustmentType,
} from '../types/admin.types';

export interface SellingPlanGroupWithPlans {
  name: string;
  plans: SellingPlan[];
}

export interface SellingPlan {
  id: number;
  name: string;
  pricingPolicy?: PricingPolicy | null;
}

export interface PricingPolicy {
  type: SellingPlanPricingPolicyAdjustmentType;
  value:
    | {
        amount: number;
        currencyCode: CurrencyCode;
      }
    | {
        percentage: number;
      };
}
