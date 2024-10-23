const BulkMutationRun = `#graphql
mutation BulkMutationRun(
  $mutationString: String!
  $path: String!
) {
  bulkOperationRunMutation(
    mutation: $mutationString
    stagedUploadPath: $path
  ) {
    bulkOperation {
      id
      url
      status
    }
    userErrors {
      message
      field
      code
    }
  }
}
`;

export default BulkMutationRun;
