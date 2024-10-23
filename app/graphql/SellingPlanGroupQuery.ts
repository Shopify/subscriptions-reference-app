const SellingPlanGroup = `#graphql
query SellingPlanGroup(
  $id: ID!
  $firstProducts: Int = 1
  $productsAfter: String
  $variantsAfter: String
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
    products(first: $firstProducts, after: $productsAfter) {
      edges {
        node {
          id
          featuredImage {
            id
            altText
            transformedSrc: url(transform: {maxWidth: 100, maxHeight: 100})
          }
          totalVariants
          title
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
    productVariants(first: $firstProducts, after: $variantsAfter) {
      edges {
        node {
          id
          product {
            id
            featuredImage {
              id
              altText
              transformedSrc: url(transform: {maxWidth: 100, maxHeight: 100})
            }
            totalVariants
            title
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
    productsCount {
      count
    }
    productVariantsCount {
      count
    }
  }
}`;

export default SellingPlanGroup;
