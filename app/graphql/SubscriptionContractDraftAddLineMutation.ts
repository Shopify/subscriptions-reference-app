const SubscriptionContractDraftAddLine = `#graphql
mutation SubscriptionContractDraftAddLine(
  $draftId: ID!
  $input: SubscriptionLineInput!
) {
  subscriptionDraftLineAdd(draftId: $draftId, input: $input) {
    lineAdded {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionContractDraftAddLine;
