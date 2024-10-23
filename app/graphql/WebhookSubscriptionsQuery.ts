const WebhookSubscriptions = `#graphql
query WebhookSubscriptions {
  webhookSubscriptions(first: 20) {
    edges {
      node {
        id,
        topic,
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
    }
  }
}
`;

export default WebhookSubscriptions;
