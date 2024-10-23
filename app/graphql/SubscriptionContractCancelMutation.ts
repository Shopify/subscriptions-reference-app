const SubscriptionContractCancel = `#graphql
mutation SubscriptionContractCancel($subscriptionContractId: ID!) {
  subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
    contract {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractCancel;
