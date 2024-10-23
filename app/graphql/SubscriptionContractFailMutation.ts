const SubscriptionContractFail = `#graphql
mutation subscriptionContractFail($subscriptionContractId: ID!) {
  subscriptionContractFail(subscriptionContractId: $subscriptionContractId) {
    contract {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractFail;
