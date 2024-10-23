const PaymentMethodsQuery = `#graphql
query PaymentMethods {
  customer {
    creditCards(first: 25) {
      edges {
        node {
          id
          brand
          walletType
          lastDigits
        }
      }
    }
    paypalBillingAgreement {
      id
      paypalAccountEmail
    }
  }
}
`;

export default PaymentMethodsQuery;
