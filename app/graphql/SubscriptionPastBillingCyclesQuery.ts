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
        billingAttempts(first: $numberOfAttempts) {
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
  }
}
`;

export default SubscriptionPastBillingCycles;
