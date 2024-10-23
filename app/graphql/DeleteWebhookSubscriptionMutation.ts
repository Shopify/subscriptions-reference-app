const DeleteWebhookSubscription = `#graphql
mutation DeleteWebhookSubscription($id: ID!) {
  webhookSubscriptionDelete(id: $id) {
    deletedWebhookSubscriptionId
    userErrors {
      message
    }
  }
}
`;

export default DeleteWebhookSubscription;
