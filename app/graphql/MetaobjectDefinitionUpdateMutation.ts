const MetaobjectDefinitionUpdate = `#graphql
  mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        name
        type
        fieldDefinitions {
          key
          name
          description
          required
          type {
            name
          }
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

export default MetaobjectDefinitionUpdate;
