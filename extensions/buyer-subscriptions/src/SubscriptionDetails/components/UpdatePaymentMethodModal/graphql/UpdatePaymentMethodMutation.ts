const UpdatePaymentMethodMutation = `#graphql
mutation UpdatePaymentMethod(
  $subscriptionContractId: ID!
  $paymentInstrumentId: ID!
) {
  subscriptionContractChangePaymentInstrument(
    subscriptionContractId: $subscriptionContractId
    paymentInstrumentId: $paymentInstrumentId
  ) {
    contract {
      id
      paymentInstrument {
        id
      }
    }
    userErrors {
      message
    }
  }
}
`;

export default UpdatePaymentMethodMutation;
