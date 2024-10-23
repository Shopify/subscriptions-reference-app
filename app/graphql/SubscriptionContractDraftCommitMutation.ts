const SubscriptionContractDraftCommit = `#graphql
mutation SubscriptionDraftCommit($draftId: ID!) {
  subscriptionDraftCommit(draftId: $draftId) {
    contract {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractDraftCommit;
