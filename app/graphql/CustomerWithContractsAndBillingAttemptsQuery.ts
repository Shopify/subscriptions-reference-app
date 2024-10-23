const CustomerWithContractsAndBillingAttemptsQuery = `#graphql
query CustomerWithContractsAndBillingAttempts($customerId: ID!) {
  customer(id: $customerId) {
    id
    subscriptionContracts(first: 20, reverse: true) {
      edges {
        node {
          id
          status
          lastPaymentStatus
          app {
            id
          }
          billingAttempts(first: 1, reverse: true) {
            edges {
              node {
                originTime
              }
            }
          }
        }
      }
    }
  }
}
`;

export default CustomerWithContractsAndBillingAttemptsQuery;
