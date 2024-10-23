const BulkOperationById = `#graphql
query BulkOperationById($id: ID!) {
  bulkOperationById: node(id: $id) {
    id
    __typename
    ... on BulkOperation {
      id
      status
      objectCount
      url
      partialDataUrl
    }
  }
}
`;

export default BulkOperationById;
