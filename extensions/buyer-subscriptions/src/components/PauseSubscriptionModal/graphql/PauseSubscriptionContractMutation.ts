const PauseSubscriptionContractMutation = `#graphql
mutation PauseSubscriptionContract($subscriptionContractId: ID!) {
  subscriptionContractPause(subscriptionContractId: $subscriptionContractId) {
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

export default PauseSubscriptionContractMutation;
