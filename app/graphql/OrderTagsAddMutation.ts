const OrderTagsAddMutation = `#graphql
  mutation tagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default OrderTagsAddMutation;
