const UnskipOrderMutation = `#graphql
mutation UnskipOrder($subscriptionContractId: ID!, $billingCycleIndex: Int!) {
  subscriptionBillingCycleUnskip(
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

export default UnskipOrderMutation;
