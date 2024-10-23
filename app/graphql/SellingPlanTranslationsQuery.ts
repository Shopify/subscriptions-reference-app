const SellingPlanTranslations = `#graphql
query SellingPlanTranslations(
  $id: ID!
  $sellingPlanLimit: Int = 31
) {
  sellingPlanGroup(id: $id) {
    id
    name
    merchantCode
    sellingPlans(first: $sellingPlanLimit) {
      edges {
        node {
          id
          deliveryPolicy {
            ... on SellingPlanRecurringDeliveryPolicy {
              interval
              intervalCount
            }
          }
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
        }
      }
    }
  }
}`;

export default SellingPlanTranslations;
