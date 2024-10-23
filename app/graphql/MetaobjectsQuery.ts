const Metaobjects = `#graphql
query Metaobjects($type: String!, $sortKey: String, $first: Int!) {
  metaobjects(first: $first, type: $type, sortKey: $sortKey, reverse: true) {
    edges {
      node {
        id
        fields {
          key
          value
          type
        }
      }
    }
  }
}
`;

export default Metaobjects;
