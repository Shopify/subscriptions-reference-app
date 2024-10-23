const getTranslatableResourcesById = `#graphql
query getTranslatableResourcesById(
  $first: Int
  $resourceIds: [ID!]!
  ) {
  translatableResourcesByIds(first: $first, resourceIds: $resourceIds) {
    edges {
      node {
        resourceId
        translatableContent {
          key
          value
          digest
          locale
        }
      }
    }
  }
}
`;

export default getTranslatableResourcesById;
