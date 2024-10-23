const SubscriptionPastBillingCycles = `#graphql
query SubscriptionPastBillingCycles(
  $contractId: ID!,
  $numberOfCycles: Int!,
  $numberOfAttempts: Int!,
  $startDate: DateTime!,
  $endDate: DateTime!
) {
  subscriptionBillingCycles(
    contractId: $contractId,
    first: $numberOfCycles,
    billingCyclesDateRangeSelector: { startDate: $startDate, endDate: $endDate },
    reverse: true
  ) {
    edges {
      node {
        billingAttemptExpectedDate
        cycleIndex
        skipped
        status
        billingAttempts(first: $numberOfAttempts, reverse: true) {
          edges {
            node {
              id
              order {
                id
                createdAt
              }
              processingError {
                code
                ... on SubscriptionBillingAttemptOutOfStockProductVariantsError {
                  outOfStockProductVariants(first: 5) {
                    edges {
                      node {
                        id
                        title
                        image {
                          url
                          altText
                        }
                        product {
                          featuredMedia {
                            preview {
                              image {
                                altText
                                url
                              }
                            }
                          }
                          id
                          title
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
  }
}
`;

export default SubscriptionPastBillingCycles;
