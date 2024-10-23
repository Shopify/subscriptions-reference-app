const SubscriptionContracts = `#graphql
query SubscriptionContracts(
  $first: Int
  $last: Int
  $before: String
  $after: String,
  $query: String,
  $sortKey: SubscriptionContractsSortKeys,
  $reverse: Boolean,
) {
  subscriptionContracts(
    first: $first
    last: $last
    before: $before
    after: $after
    query: $query
    sortKey: $sortKey
    reverse: $reverse,
  ) {
    edges {
      node {
        id
        currencyCode
        customer {
          id
          displayName
        }
        status
        deliveryPolicy {
          interval
          intervalCount
        }
        linesCount {
          count
        }
        billingAttempts(first: 1, reverse: true) {
          edges {
            node {
              id
              errorCode
            }
          }
        }
        lines(first: 50) {
          edges {
            node {
              id
              productId
              title
              lineDiscountedPrice {
                amount
                currencyCode
              }            }
          }
        }
              }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
      startCursor
    }
  }
  contractsWithInventoryError: subscriptionContracts(
    first: 1,
    query: "NOT status:CANCELLED AND last_billing_attempt_error_type:inventory_error",
  ) {
    edges {
      node {
        id
      }
    }
  }
}
`;

export default SubscriptionContracts;
