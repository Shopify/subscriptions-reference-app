const SubscriptionBillingCycles = `#graphql
query SubscriptionBillingCycles($contractId: ID!, $first: Int!, $startDate: DateTime!, $endDate: DateTime!) {
  subscriptionBillingCycles(
    contractId: $contractId,
    first: $first,
    billingCyclesDateRangeSelector: { startDate: $startDate, endDate: $endDate }
  ) {
    edges {
      node {
        billingAttemptExpectedDate
        cycleIndex
        skipped
        billingAttempts(first: 10) {
          edges {
            node {
              id
              order {
                id
                createdAt
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`;

export default SubscriptionBillingCycles;
