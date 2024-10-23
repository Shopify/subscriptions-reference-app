const DeleteSellingPlanGroup = `#graphql
mutation DeleteSellingPlanGroup($id: ID!) {
  sellingPlanGroupDelete(id: $id) {
    deletedSellingPlanGroupId
    userErrors {
      field
      message
    }
  }
}
`;

export default DeleteSellingPlanGroup;
