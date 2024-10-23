const MetaobjectCreate = `#graphql
mutation MetaobjectCreate($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
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

export default MetaobjectCreate;
