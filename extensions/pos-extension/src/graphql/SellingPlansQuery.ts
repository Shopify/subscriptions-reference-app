const SellingPlansQuery = `#graphql
  query GetSellingPlans($variantId: ID!) {
    productVariant(id: $variantId) {
      id
      sellingPlanGroups(first: 50) {
        edges {
          node {
            name
            appId
            sellingPlans(first: 10) {
              nodes {
                id
                name
                category
                pricingPolicies {
                  ... on SellingPlanFixedPricingPolicy {
                    adjustmentType
                    adjustmentValue {
                      __typename
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on SellingPlanPricingPolicyPercentageValue {
                        percentage
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default SellingPlansQuery;
