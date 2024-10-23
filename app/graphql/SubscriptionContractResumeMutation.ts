const SubscriptionContractResume = `#graphql
mutation SubscriptionContractResume($subscriptionContractId: ID!) {
  subscriptionContractActivate(subscriptionContractId: $subscriptionContractId) {
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

export default SubscriptionContractResume;
