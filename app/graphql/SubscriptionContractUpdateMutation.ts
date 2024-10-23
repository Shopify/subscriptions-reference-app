const SubscriptionContractUpdate = `#graphql
mutation SubscriptionContractUpdate($contractId: ID!) {
  subscriptionContractUpdate(contractId: $contractId) {
    draft {
      id
    }
    userErrors {
      code
      field
      message
    }
  }
}
`;

export default SubscriptionContractUpdate;
