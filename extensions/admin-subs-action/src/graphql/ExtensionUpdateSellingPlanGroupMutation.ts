const ExtensionUpdateSellingPlanGroup = `#graphql
mutation ExtensionUpdateSellingPlanGroup(
  $id: ID!
  $input: SellingPlanGroupInput!
) {
  sellingPlanGroupUpdate(id: $id, input: $input) {
    sellingPlanGroup {
      id
      sellingPlans(first: 31) {
        edges {
          node {
            id
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default ExtensionUpdateSellingPlanGroup;
