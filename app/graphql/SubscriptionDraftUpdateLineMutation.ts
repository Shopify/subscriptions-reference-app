const SubscriptionDraftUpdateLine = `#graphql
mutation SubscriptionDraftLineUpdate(
  $draftId: ID!
  $input: SubscriptionLineUpdateInput!
  $lineId: ID!
) {
  subscriptionDraftLineUpdate(
    draftId: $draftId
    input: $input
    lineId: $lineId
  ) {
    lineUpdated {
      id
      variantId
      quantity
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionDraftUpdateLine;
