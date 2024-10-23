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
}
`;

export default SubscriptionContracts;
