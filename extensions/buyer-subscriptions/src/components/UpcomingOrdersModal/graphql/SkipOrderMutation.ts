const SkipOrderMutation = `#graphql
mutation SkipOrder($subscriptionContractId: ID!, $billingCycleIndex: Int!) {
  subscriptionBillingCycleSkip(
    billingCycleInput: {
      contractId: $subscriptionContractId
      selector: {index: $billingCycleIndex}
    }
  ) {
    billingCycle {
      cycleIndex
      skipped
      billingAttemptExpectedDate
    }
    userErrors {
      message
    }
  }
}
`;

export default SkipOrderMutation;
