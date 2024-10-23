import {composeGid} from '@shopify/admin-graphql-api-utilities';
import type {
  CreateSellingPlanGroupMutation as CreateSellingPlanGroupMutationType,
  SellingPlanGroupQuery as SellingPlanGroupQueryType,
} from 'types/admin.generated';
type GraphqlSellingPlanGroup = NonNullable<
  SellingPlanGroupQueryType['sellingPlanGroup']
>;
type GraphqlSellingPlanGroupProduct =
  GraphqlSellingPlanGroup['products']['edges'][number]['node'];
type GraphqlSellingPlanGroupProductVariant =
  GraphqlSellingPlanGroup['productVariants']['edges'][number]['node'];

export function mockSellingPlanGroupGraphqlResponse(
  response?: Partial<GraphqlSellingPlanGroup>,
): GraphqlSellingPlanGroup {
  return {
    id: composeGid('SellingPlanGroup', 1),
    merchantCode: 'merchantCode',
    name: 'name',
    products: {
      edges: [{node: mockSellingPlanGroupProduct()}],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: 'endCursor',
      },
    },
    productVariants: {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: 'endCursor',
      },
    },
    productsCount: {count: 1},
    productVariantsCount: {count: 0},
    sellingPlans: {
      edges: [],
    },
    ...response,
  };
}

export function mockSellingPlanGroupProduct(
  response?: Partial<GraphqlSellingPlanGroupProduct>,
): GraphqlSellingPlanGroupProduct {
  return {
    id: composeGid('Product', 1),
    title: 'Product 1',
    totalVariants: 1,
    featuredImage: {
      id: composeGid('ProductImage', 1),
      altText: 'image description',
      transformedSrc: 'https://shopify.com/image.png',
    },
    ...response,
  };
}

export function mockSellingPlanGroupProductVariant(
  response?: Partial<GraphqlSellingPlanGroupProductVariant>,
): GraphqlSellingPlanGroupProductVariant {
  return {
    id: composeGid('ProductVariant', 1),
    product: mockSellingPlanGroupProduct(),
    ...response,
  };
}

export function mockSellingPlanGroupCreateResponse(): CreateSellingPlanGroupMutationType {
  return {
    sellingPlanGroupCreate: {
      sellingPlanGroup: {
        id: composeGid('SellingPlanGroup', 1),
        sellingPlans: {
          edges: [
            {
              node: {
                id: composeGid('SellingPlan', 1),
                name: 'Plan 1',
                pricingPolicies: [],
                deliveryPolicy: {},
              },
            },
          ],
        },
      },
      userErrors: [],
    },
  };
}
