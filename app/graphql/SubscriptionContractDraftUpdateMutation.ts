const SubscriptionContractDraftUpdate = `#graphql
mutation SubscriptionDraftUpdate(
  $draftId: ID!
  $input: SubscriptionDraftInput!
) {
  subscriptionDraftUpdate(draftId: $draftId, input: $input) {
    draft {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractDraftUpdate;
