const MetaobjectUpsert = `#graphql
mutation MetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
  metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
    metaobject {
      id
      fields {
        key
        value
        type
      }
    }
    userErrors {
      code
      message
      field
    }
  }
}
`;

export default MetaobjectUpsert;
