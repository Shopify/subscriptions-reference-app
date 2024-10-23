const SubscriptionContractRebillingQuery = `#graphql
query SubscriptionContractRebillingQuery($id: ID!) {
  subscriptionContract(id: $id) {
    id
    lastPaymentStatus
  }
}
`;

export default SubscriptionContractRebillingQuery;
