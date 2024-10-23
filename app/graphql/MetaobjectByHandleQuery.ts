const MetaobjectByHandle = `#graphql
query MetaobjectByHandle($handle: MetaobjectHandleInput!) {
  metaobjectByHandle(handle: $handle) {
    id
    fields {
      key
      value
      type
    }
  }
}
`;

export default MetaobjectByHandle;
