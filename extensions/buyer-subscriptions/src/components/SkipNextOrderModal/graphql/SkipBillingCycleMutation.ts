const SkipBillingCycleMutation = `#graphql
mutation SkipBillingCycle(
  $subscriptionContractId: ID!
  $billingCycleIndex: Int!
) {
  subscriptionBillingCycleSkip(
    billingCycleInput: {
      contractId: $subscriptionContractId
      selector: {index: $billingCycleIndex}
    }
  ) {
    billingCycle {
      cycleIndex
      skipped
    }
    userErrors {
      message
    }
  }
}
`;

export default SkipBillingCycleMutation;
