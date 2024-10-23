const MetaobjectDefinitionByType = `#graphql
  query MetaobjectDefinitionByType($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      name
      type
      fieldDefinitions {
        key
        name
        description
        required
      }
    }
  }
`;

export default MetaobjectDefinitionByType;
