const MetaobjectFieldsUpdateMutation = `#graphql
mutation MetaobjectFieldsUpdateMutation($id: ID!, $metaobject: MetaobjectUpdateInput!) {
  metaobjectUpdate(id: $id, metaobject: $metaobject) {
    metaobject {
      id
    }
    userErrors {
      message
      field
    }
  }
}
`;

export default MetaobjectFieldsUpdateMutation;
