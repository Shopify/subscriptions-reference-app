const SubscriptionContractAtomicCreate = `#graphql
mutation SubscriptionContractAtomicCreate($input: SubscriptionContractAtomicCreateInput!) {
  subscriptionContractAtomicCreate(input: $input) {
    contract {
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

export default SubscriptionContractAtomicCreate;
