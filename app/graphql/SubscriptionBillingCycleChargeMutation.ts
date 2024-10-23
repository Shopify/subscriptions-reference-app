const SubscriptionBillingCycleChargeMutation = `#graphql
mutation SubscriptionBillingCycleChargeMutation(
  $subscriptionContractId: ID!
  $originTime: DateTime!
) {
  subscriptionBillingCycleCharge(
    subscriptionContractId: $subscriptionContractId
    billingCycleSelector: {
      date: $originTime
    }
  ) {
    subscriptionBillingAttempt {
      id
      ready
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;

export default SubscriptionBillingCycleChargeMutation;
