const BulkOperationRunQuery = `
mutation BulkOperationRunQuery(
  $queryString: String!
) {
  bulkOperationRunQuery(query: $queryString) {
    bulkOperation {
      id
      url
      status
    }
    userErrors {
      message
      field
    }
  }
}
`;

export default BulkOperationRunQuery;
