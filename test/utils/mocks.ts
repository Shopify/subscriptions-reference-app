import {faker} from '@faker-js/faker';
import type {
  SellingPlanGroupProduct,
  SellingPlanGroupProductVariant,
} from '~/types';

export function createMockGraphQLProduct(
  product?: Partial<SellingPlanGroupProduct>,
): SellingPlanGroupProduct {
  return {
    id: 'gid://shopify/Product/1',
    totalVariants: 0,
    title: faker.commerce.productName(),
    featuredImage: {
      id: 'gid://shopify/ProductImage/1',
      transformedSrc: faker.image.url(),
      altText: faker.commerce.productDescription(),
    },
    ...product,
  };
}

export function createMockGraphQLProductVariant(
  productVariant?: Partial<SellingPlanGroupProductVariant>,
): SellingPlanGroupProductVariant {
  return {
    id: 'gid://shopify/ProductVariant/1',
    title: faker.commerce.productName(),
    product: createMockGraphQLProduct(),
    ...productVariant,
  };
}
