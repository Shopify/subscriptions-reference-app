const PaymentUpdateDetails = `#graphql
  query PaymentUpdateDetails($contractId: ID!) {
    shop {
      name
      contactEmail
    }
    subscriptionContract(id: $contractId) {
      id
      customer {
        email
      }
      customerPaymentMethod(showRevoked: true) {
        id
      }
    }
  }
`;

export default PaymentUpdateDetails;
