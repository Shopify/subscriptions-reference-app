const SubscriptionContractDraftRemoveDiscount = `#graphql
mutation SubscriptionContractDraftRemoveDiscount(
  $draftId: ID!
  $discountId: ID!
) {
  subscriptionDraftDiscountRemove(
    draftId: $draftId
    discountId: $discountId
  ) {
    draft {
      id
    }
    userErrors{
      code
      field
      message
    }
  }
}
`;

export default SubscriptionContractDraftRemoveDiscount;
