export const SellingPlanDetailsFragment = `#graphql
fragment SellingPlanDetails on SellingPlan {
  id
  name
  pricingPolicies {
    ... on SellingPlanFixedPricingPolicy {
      adjustmentType
      adjustmentValue {
        ... on SellingPlanPricingPolicyPercentageValue {
          percentage
        }
        ... on MoneyV2 {
          amount
          currencyCode
        }
      }
    }
    ... on SellingPlanRecurringPricingPolicy {
      adjustmentType
    }
    ... on SellingPlanPricingPolicyBase {
      adjustmentType
    }
  }
  deliveryPolicy {
    ... on SellingPlanFixedDeliveryPolicy {
      fulfillmentExactTime
    }
    ... on SellingPlanRecurringDeliveryPolicy {
      interval
      intervalCount
    }
  }
}
`;
