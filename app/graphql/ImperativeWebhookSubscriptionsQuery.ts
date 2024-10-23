const ImperativeWebhookSubscriptions = `#graphql
query ImperativeWebhookSubscriptions {
  webhookSubscriptions(first: 20) {
    edges {
      node {
        id
      }
    }
  }
}
`;

export default ImperativeWebhookSubscriptions;
