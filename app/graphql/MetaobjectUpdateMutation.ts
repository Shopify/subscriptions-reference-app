const MetaobjectUpdate = `#graphql
mutation MetaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
  metaobjectUpdate(id: $id, metaobject: $metaobject) {
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

export default MetaobjectUpdate;
