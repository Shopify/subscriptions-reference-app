const CustomerPaymentMethodSendUpdateEmail = `#graphql
mutation CustomerPaymentMethodSendUpdateEmail(
  $customerPaymentMethodId: ID!
  $emailInput: EmailInput
) {
  customerPaymentMethodSendUpdateEmail(
    customerPaymentMethodId: $customerPaymentMethodId
    email: $emailInput
  ) {
    customer {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default CustomerPaymentMethodSendUpdateEmail;
