const BulkOperationQuery = `#graphql
query BulkOperationQuery {
  currentBulkOperation(type: MUTATION) {
    id
    status
    rootObjectCount
  }
}
`;

export default BulkOperationQuery;
