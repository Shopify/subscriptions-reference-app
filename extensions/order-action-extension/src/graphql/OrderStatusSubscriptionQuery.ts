const OrderStatusSubscriptionQuery = `#graphql
query OrderStatusSubscription($orderId: ID!) {
  order(id: $orderId) {
    subscriptionContracts(first: 10, query: "NOT status:cancelled") {
      edges {
        node {
          id
          status
        }
      }
    }
  }
}
`;

export default OrderStatusSubscriptionQuery;
