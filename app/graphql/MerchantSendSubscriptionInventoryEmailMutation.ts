const MerchantSendSubscriptionInventoryEmail = `#graphql
mutation MerchantSendSubscriptionInventoryEmail {
  merchantSendSubscriptionInventoryFailureEmail {
    success
    userErrors {
      field
      message
    }
  }
}
`;

export default MerchantSendSubscriptionInventoryEmail;
