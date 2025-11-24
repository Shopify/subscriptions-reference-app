import {
  ProductSearchApiContent,
  ProductVariant,
  Product,
} from '@shopify/ui-extensions/point-of-sale';

export const mockRemoteProduct: Product = {
  id: 1,
  title: 'Remote Product',
  featuredImage: 'https://example.com/image.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  description: 'Remote product description',
  descriptionHtml: '<p>Remote product description</p>',
  onlineStoreUrl: 'https://example.com/products/test-product',
  productType: 'Test Type',
  tags: [],
  totalInventory: 100,
  tracksInventory: true,
  vendor: 'Remote Vendor',
  isGiftCard: false,
  minVariantPrice: '',
  maxVariantPrice: '',
  productCategory: '',
  numVariants: 1,
  variants: [],
  options: [],
  hasOnlyDefaultVariant: false,
};

export const mockRemoteProductVariant: ProductVariant = {
  id: 2,
  title: 'Remote Variant',
  product: mockRemoteProduct,
  price: '10.00',
  compareAtPrice: undefined,
  sku: 'TEST-SKU',
  inventoryPolicy: 'DENY',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  displayName: 'Test Variant',
  image: undefined,
  position: 1,
  taxable: false,
  inventoryIsTracked: false,
  productId: 0,
};

const mockRemoteProductVariantWithDefaultTitle: ProductVariant = {
  ...mockRemoteProductVariant,
  id: 3,
  title: 'Default Title',
  product: {
    ...mockRemoteProduct,
    id: 2,
    title: 'Remote Product with Default Variant',
    featuredImage: 'https://example.com/image2.jpg',
  },
};

export const mockProductSearchApiContent: ProductSearchApiContent = {
  fetchProductVariantsWithIds: async (variantIds: number[]) => {
    const variants = variantIds.map((id) => {
      if (id === 2) return mockRemoteProductVariant;
      if (id === 3) return mockRemoteProductVariantWithDefaultTitle;
      return {
        ...mockRemoteProductVariant,
        id,
        title: `Test Variant ${id}`,
        product: {
          ...mockRemoteProduct,
          id,
          title: `Test Product ${id}`,
          featuredImage: `https://example.com/image${id}.jpg`,
        },
      };
    });

    return {
      fetchedResources: variants,
      idsForResourcesNotFound: [],
    };
  },
  searchProducts: async () => ({items: [], hasNextPage: false}),
  fetchProductWithId: async () => undefined,
  fetchProductsWithIds: async () => ({
    fetchedResources: [],
    idsForResourcesNotFound: [],
  }),
  fetchProductVariantWithId: async () => undefined,
  fetchProductVariantsWithProductId: async () => [],
  fetchPaginatedProductVariantsWithProductId: async () => ({
    items: [],
    hasNextPage: false,
  }),
};

export const mockEmptyProductSearchApiContent: ProductSearchApiContent = {
  fetchProductVariantsWithIds: async () => ({
    fetchedResources: [],
    idsForResourcesNotFound: [],
  }),
  searchProducts: async () => ({items: [], hasNextPage: false}),
  fetchProductWithId: async () => undefined,
  fetchProductsWithIds: async () => ({
    fetchedResources: [],
    idsForResourcesNotFound: [],
  }),
  fetchProductVariantWithId: async () => undefined,
  fetchProductVariantsWithProductId: async () => [],
  fetchPaginatedProductVariantsWithProductId: async () => ({
    items: [],
    hasNextPage: false,
  }),
};
