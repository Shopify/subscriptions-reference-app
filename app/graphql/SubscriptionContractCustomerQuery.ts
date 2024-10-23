const SubscriptionContractCustomerQuery = `#graphql
query SubscriptionContractCustomerQuery($id: ID!) {
  subscriptionContract(id: $id) {
    customer {
      id
    }
  }
}
`;

export default SubscriptionContractCustomerQuery;
