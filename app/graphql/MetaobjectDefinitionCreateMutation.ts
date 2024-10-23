const MetaobjectDefinitionCreate = `#graphql
  mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        name
        type
        fieldDefinitions {
          key
          name
          type {
            name
          }
          description
          required
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

export default MetaobjectDefinitionCreate;
