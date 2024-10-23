import type {Percentage, SellingPlanAdjustmentValue} from '~/types/plans';

export function PricingPolicyAdjustmentValueIsPercentage(
  adjustmentValue: SellingPlanAdjustmentValue,
): adjustmentValue is Percentage {
  return adjustmentValue ? 'percentage' in adjustmentValue : false;
}
