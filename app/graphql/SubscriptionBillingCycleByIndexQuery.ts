const SubscriptionBillingCycleByIndex = `#graphql
query SubscriptionBillingCycleByIndex(
  $contractId: ID!,
  $billingCycleIndex: Int!,
) {
  subscriptionBillingCycle(
    billingCycleInput: {
    contractId: $contractId,
    selector: {
      index: $billingCycleIndex
    }
  }) {
    cycleStartAt
    cycleEndAt
    billingAttemptExpectedDate
  }
}
`;

export default SubscriptionBillingCycleByIndex;
