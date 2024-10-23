import type {
  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
} from 'generatedTypes/admin.types';
import type {ExtensionSellingPlanGroupDetailsQuery} from 'generatedTypes/admin.generated';

type SellingPlanGroup =
  ExtensionSellingPlanGroupDetailsQuery['sellingPlanGroup'];

export function createMockSellingPlanGroup(
  sellingPlanGroup?: Partial<SellingPlanGroup>,
): SellingPlanGroup {
  return {
    id: 'gid://shopify/SellingPlanGroup/2',
    merchantCode: 'Test merchant code',
    name: 'Test title',
    sellingPlans: {
      edges: [
        {
          node: {
            id: 'gid://shopify/SellingPlan/2',
            billingPolicy: {
              interval: 'MONTH' as SellingPlanInterval,
              intervalCount: 2,
            },
            pricingPolicies: [
              {
                adjustmentType:
                  'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
                adjustmentValue: {
                  percentage: 10,
                },
              },
            ],
          },
        },
      ],
    },
    ...sellingPlanGroup,
  };
}
