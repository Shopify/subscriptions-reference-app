import {SellingPlanDetailsFragment} from './SellingPlanDetailsFragment';

const SellingPlanGroupUpdate = `#graphql
mutation SellingPlanGroupUpdate(
  $id: ID!
  $input: SellingPlanGroupInput!
  $productIdsToAdd: [ID!]!
  $productIdsToRemove: [ID!]!
  $productVariantIdsToAdd: [ID!]!
  $productVariantIdsToRemove: [ID!]!
) {
  sellingPlanGroupUpdate(id: $id, input: $input) {
    sellingPlanGroup {
      id
      sellingPlans(first: 31) {
        edges {
          node {
            ...SellingPlanDetails
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
  # Check if we can make these optional
  # might need to pass in more args as booleans
  sellingPlanGroupAddProducts(id: $id, productIds: $productIdsToAdd) {
    userErrors {
      field
      message
    }
  }
  sellingPlanGroupRemoveProducts(id: $id, productIds: $productIdsToRemove) {
    userErrors {
      field
      message
    }
  }
  sellingPlanGroupAddProductVariants(
    id: $id
    productVariantIds: $productVariantIdsToAdd
  ) {
    userErrors {
      field
      message
    }
  }
  sellingPlanGroupRemoveProductVariants(
    id: $id
    productVariantIds: $productVariantIdsToRemove
  ) {
    userErrors {
      field
      message
    }
  }
}
${SellingPlanDetailsFragment}
`;

export default SellingPlanGroupUpdate;
