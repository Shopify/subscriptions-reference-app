const ActivateSubscriptionMutation = `#graphql
mutation ActivateSubscriptionContract($subscriptionContractId: ID!) {
  subscriptionContractActivate(
    subscriptionContractId: $subscriptionContractId
  ) {
    contract {
      id
      status
    }
    userErrors {
      message
    }
  }
}
`;

export default ActivateSubscriptionMutation;
