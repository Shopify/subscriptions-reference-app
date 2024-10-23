const ExtensionCreateSellingPlanGroup = `#graphql
  mutation ExtensionCreateSellingPlanGroup(
    $input: SellingPlanGroupInput!
    $resources: SellingPlanGroupResourceInput
  ) {
    sellingPlanGroupCreate(input: $input, resources: $resources) {
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

export default ExtensionCreateSellingPlanGroup;
