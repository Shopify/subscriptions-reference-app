const SellingPlanGroups = `#graphql
query SellingPlanGroups(
  $first: Int
  $last: Int
  $before: String
  $after: String
  $query: String
  $sortKey: SellingPlanGroupSortKeys
  $reverse: Boolean
) {
  sellingPlanGroups(
    first: $first
    last: $last
    before: $before
    after: $after
    query: $query
    sortKey: $sortKey
    reverse: $reverse
  ) {
    edges {
      cursor
      node {
        id
        name
        createdAt
        merchantCode
        options
        summary
        productsCount {
          count
        }
        productVariantsCount {
          count
        }
        sellingPlans(first: 5) {
          edges {
            node {
              options
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
              }
              deliveryPolicy {
                ... on SellingPlanRecurringDeliveryPolicy {
                  interval
                  intervalCount
                }
                ... on SellingPlanFixedDeliveryPolicy {
                  cutoff
               }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
        products(first: 5) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
`;

export default SellingPlanGroups;
