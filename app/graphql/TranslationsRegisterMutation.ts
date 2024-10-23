const translationsRegisterMutation = `#graphql
mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
  translationsRegister(resourceId: $resourceId, translations: $translations) {
    userErrors {
      message
      field
    }
    translations {
      key
      value
    }
  }
}
`;

export default translationsRegisterMutation;
