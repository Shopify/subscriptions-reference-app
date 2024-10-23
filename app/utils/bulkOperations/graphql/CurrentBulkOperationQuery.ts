const CurrentBulkOperation = `#graphql
query CurrentBulkOperation($type: BulkOperationType) {
  currentBulkOperation(type: $type) {
    id
    type
    status
    url
    query
  }
}
`;
export default CurrentBulkOperation;
