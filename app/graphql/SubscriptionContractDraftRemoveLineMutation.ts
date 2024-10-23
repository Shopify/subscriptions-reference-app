const SubscriptionContractDraftRemoveLine = `#graphql
mutation SubscriptionDraftLineRemove($draftId: ID!, $lineId: ID!) {
  subscriptionDraftLineRemove(draftId: $draftId, lineId: $lineId) {
    lineRemoved {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractDraftRemoveLine;
