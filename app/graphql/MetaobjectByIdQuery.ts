const MetaobjectById = `#graphql
query MetaobjectById($id: ID!) {
  metaobject(id: $id) {
    id
    fields {
      key
      value
      type
    }
  }
}
`;

export default MetaobjectById;
