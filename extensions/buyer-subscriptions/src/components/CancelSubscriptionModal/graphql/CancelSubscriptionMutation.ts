const CancelSubscriptionMutation = `#graphql
mutation CancelSubscriptionContract($subscriptionContractId: ID!) {
  subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
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

export default CancelSubscriptionMutation;
