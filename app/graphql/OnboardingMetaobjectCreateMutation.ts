const OnboardingMetaobjectCreate = `#graphql
mutation OnboardingMetaobjectCreate($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
    metaobject {
      id
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

export default OnboardingMetaobjectCreate;
