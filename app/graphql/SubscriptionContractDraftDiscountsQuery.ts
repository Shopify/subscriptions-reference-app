const SubscriptionContractDraftDiscounts = `#graphql
query SubscriptionContractDraftDiscounts($id: ID!) {
  subscriptionDraft(
    id: $id
  ) {
    id
    discounts(first:10) {
      edges {
        node {
          ... on SubscriptionAppliedCodeDiscount {
            id
          }
          ... on SubscriptionManualDiscount {
            id
            entitledLines {
              all
              lines(first:50) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

export default SubscriptionContractDraftDiscounts;
