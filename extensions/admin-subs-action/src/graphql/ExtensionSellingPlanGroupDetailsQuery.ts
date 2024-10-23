const ExtensionSellingPlanGroupDetails = `#graphql
query ExtensionSellingPlanGroupDetails(
  $id: ID!
) {
  sellingPlanGroup(id: $id) {
    id
    name
    merchantCode
    sellingPlans(first: 31) {
      edges {
        node {
          id
          billingPolicy {
            ... on SellingPlanRecurringBillingPolicy {
              interval
              intervalCount
            }
            ... on SellingPlanFixedBillingPolicy {
              remainingBalanceChargeTrigger
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

export default ExtensionSellingPlanGroupDetails;
