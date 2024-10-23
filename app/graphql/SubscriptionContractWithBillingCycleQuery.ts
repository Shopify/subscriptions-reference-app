const SubscriptionContractWithBillingCycle = `#graphql
query SubscriptionContractWithBillingCycle(
  $contractId: ID!
  $date: DateTime!
) {
  subscriptionContract(id: $contractId) {
    id
    status
    customer {
      id
    }
  }
  subscriptionBillingCycle(
    billingCycleInput: {contractId: $contractId, selector: {date: $date}}
  ) {
    cycleIndex
    billingAttemptExpectedDate
    status
    billingAttempts(first: 20) {
      edges {
        node {
          ready
          originTime
        }
      }
    }
  }
}
`;

export default SubscriptionContractWithBillingCycle;
