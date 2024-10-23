const SubscriptionBillingAttempt = `#graphql
query SubscriptionBillingAttempt($billingAttemptId: ID!) {
  subscriptionBillingAttempt(id: $billingAttemptId) {
    id
    originTime
    ready
    subscriptionContract {
      id
    }
  }
}
`;

export default SubscriptionBillingAttempt;
