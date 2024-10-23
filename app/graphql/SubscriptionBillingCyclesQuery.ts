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
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`;

export default SubscriptionBillingCycles;
