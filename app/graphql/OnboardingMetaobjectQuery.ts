const OnboardingMetaobjectQuery = `#graphql
query OnboardingMetaobjectQuery($handle: MetaobjectHandleInput!) {
  metaobjectByHandle(handle: $handle) {
    id
    fields {
      key
      value
    }
  }
}
`;

export default OnboardingMetaobjectQuery;
