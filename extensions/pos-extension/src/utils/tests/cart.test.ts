import {describe, it, expect} from 'vitest';
import {
  getSubscriptionItems,
  getProductNameFromVariant,
  getVariantName,
  getVariantImage,
} from '../cart';
import type {
  Cart,
  LineItem,
  ProductVariant,
} from '@shopify/ui-extensions/point-of-sale';
import {mockLineItem} from '../../../tests/mocks/cart';
import {
  mockRemoteProduct,
  mockRemoteProductVariant,
} from '../../../tests/mocks/productSearch';

const mockCart: Cart = {
  lineItems: [],
  subtotal: '10',
  taxTotal: '1',
  grandTotal: '11',
  cartDiscounts: [],
  properties: {},
};
const createMockLineItem = (props: Partial<LineItem> = {}): LineItem => {
  return {
    uuid: '1',
    title: 'Regular Product` 1',
    quantity: 1,
    discounts: [],
    taxable: false,
    taxLines: [],
    properties: {},
    isGiftCard: false,
    ...props,
  };
};

describe('getSubscriptionItems', () => {
  it('should return empty array when cart has no line items', () => {
    const cart = mockCart;

    const result = getSubscriptionItems(cart);

    expect(result).toEqual([]);
  });

  it('should return empty array when no line items have selling plan groups', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({uuid: '1', hasSellingPlanGroups: false}),
        createMockLineItem({uuid: '2', hasSellingPlanGroups: false}),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toEqual([]);
  });

  it('should return only line items with selling plan groups', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({uuid: '1', hasSellingPlanGroups: false}),
        createMockLineItem({
          uuid: '2',
          title: 'Subscription Product',
          hasSellingPlanGroups: true,
        }),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe('2');
    expect(result[0].title).toBe('Subscription Product');
    expect(result[0].hasSellingPlanGroups).toBe(true);
  });

  it('should return all line items when all have selling plan groups', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({
          uuid: '1',
          title: 'Subscription Product 1',
          hasSellingPlanGroups: true,
        }),
        createMockLineItem({
          uuid: '2',
          title: 'Subscription Product 2',
          hasSellingPlanGroups: true,
        }),
        createMockLineItem({
          uuid: '3',
          title: 'Subscription Product 3',
          hasSellingPlanGroups: true,
        }),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.uuid)).toEqual(['1', '2', '3']);
  });

  it('should handle mixed cart with multiple subscription and regular items', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({
          uuid: '1',
          title: 'Regular Product 1',
          hasSellingPlanGroups: false,
        }),
        createMockLineItem({
          uuid: '2',
          title: 'Subscription Product 1',
          hasSellingPlanGroups: true,
        }),
        createMockLineItem({
          uuid: '3',
          title: 'Regular Product 2',
          hasSellingPlanGroups: false,
        }),
        createMockLineItem({
          uuid: '4',
          title: 'Subscription Product 2',
          hasSellingPlanGroups: true,
        }),
        createMockLineItem({
          uuid: '5',
          title: 'Regular Product 3',
          hasSellingPlanGroups: false,
        }),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toHaveLength(2);
    expect(result[0].uuid).toBe('2');
    expect(result[0].title).toBe('Subscription Product 1');
    expect(result[1].uuid).toBe('4');
    expect(result[1].title).toBe('Subscription Product 2');
  });

  it('should handle line items with undefined hasSellingPlanGroups', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({
          uuid: '1',
          title: 'Product without field',
          // hasSellingPlanGroups is undefined - not setting the property
        }),
        createMockLineItem({
          uuid: '2',
          title: 'Subscription Product',
          hasSellingPlanGroups: true,
        }),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe('2');
  });

  it('should handle line items with null hasSellingPlanGroups', () => {
    const cart: Cart = {
      ...mockCart,
      lineItems: [
        createMockLineItem({
          uuid: '1',
          title: 'Product with null',
          hasSellingPlanGroups: undefined,
        }),
        createMockLineItem({
          uuid: '2',
          title: 'Subscription Product',
          hasSellingPlanGroups: true,
        }),
      ],
    };

    const result = getSubscriptionItems(cart);

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe('2');
  });
});

describe('getProductNameFromVariant', () => {
  it('should return product title when fetchedVariant.product.title is available and not empty', () => {
    const fetchedVariant = mockRemoteProductVariant;
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Remote Product');
  });

  it('should fallback to variant title when product title is empty', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      product: {
        ...mockRemoteProduct,
        title: '',
      },
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Remote Variant');
  });

  it('should fallback to variant title when product title is only whitespace', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      product: {
        ...mockRemoteProduct,
        title: '   ',
      },
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Remote Variant');
  });

  it('should fallback to cart line item title when both product and variant titles are empty', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '',
      product: {
        ...mockRemoteProduct,
        title: '',
      },
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Local Product Title');
  });

  it('should fallback to cart line item title when both product and variant titles are whitespace', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '  ',
      product: {
        ...mockRemoteProduct,
        title: '   ',
      },
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Local Product Title');
  });

  it('should fallback to cart line item title when fetchedVariant is undefined', () => {
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(undefined, cartLineItem);

    expect(result).toBe('Local Product Title');
  });

  it('should fallback to cart line item title when product is undefined', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '',
      product: undefined,
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Local Product Title');
  });

  it('should return empty string when cart line item is undefined', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '',
      product: {
        ...mockRemoteProduct,
        title: '',
      },
    };

    const result = getProductNameFromVariant(fetchedVariant, undefined);

    expect(result).toBe('');
  });

  it('should return empty string when both fetchedVariant and cartLineItem are undefined', () => {
    const result = getProductNameFromVariant(undefined, undefined);

    expect(result).toBe('');
  });

  it('should handle case where variant title exists but product title is undefined', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      product: undefined,
    };
    const cartLineItem = mockLineItem;

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('Remote Variant');
  });

  it('should return empty string when cart line item title is also undefined', () => {
    const fetchedVariant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '',
      product: {
        ...mockRemoteProduct,
        title: '',
      },
    };
    const cartLineItem: LineItem = {
      ...mockLineItem,
      title: undefined,
    };

    const result = getProductNameFromVariant(fetchedVariant, cartLineItem);

    expect(result).toBe('');
  });
});

describe('getVariantName', () => {
  it('should return variant title when it is not "Default Title"', () => {
    const variant = mockRemoteProductVariant;

    const result = getVariantName(variant);

    expect(result).toBe('Remote Variant');
  });

  it('should return undefined when variant title is "Default Title"', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: 'Default Title',
    };

    const result = getVariantName(variant);

    expect(result).toBeUndefined();
  });

  it('should return undefined when variant is undefined', () => {
    const result = getVariantName(undefined);

    expect(result).toBeUndefined();
  });

  it('should return variant title when it is an empty string', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '',
    };

    const result = getVariantName(variant);

    expect(result).toBe('');
  });

  it('should return variant title when it is whitespace', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      title: '   ',
    };

    const result = getVariantName(variant);

    expect(result).toBe('   ');
  });
});

describe('getVariantImage', () => {
  it('should return variant image when it exists', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      image: 'https://example.com/variant-image.jpg',
    };

    const result = getVariantImage(variant);

    expect(result).toBe('https://example.com/variant-image.jpg');
  });

  it('should fallback to product featured image when variant image is undefined', () => {
    const variant = mockRemoteProductVariant; // image is undefined in mock

    const result = getVariantImage(variant);

    expect(result).toBe('https://example.com/image.jpg'); // featured image from mockRemoteProduct
  });

  it('should return undefined when both variant image and product featured image are undefined', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      image: undefined,
      product: {
        ...mockRemoteProduct,
        featuredImage: undefined,
      },
    };

    const result = getVariantImage(variant);

    expect(result).toBeUndefined();
  });

  it('should return undefined when variant is undefined', () => {
    const result = getVariantImage(undefined);

    expect(result).toBeUndefined();
  });

  it('should return undefined when variant has no product', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      image: undefined,
      product: undefined,
    };

    const result = getVariantImage(variant);

    expect(result).toBeUndefined();
  });

  it('should return variant image even when product featured image exists', () => {
    const variant: ProductVariant = {
      ...mockRemoteProductVariant,
      image: 'https://example.com/variant-image.jpg',
      product: {
        ...mockRemoteProduct,
        featuredImage: 'https://example.com/product-image.jpg',
      },
    };

    const result = getVariantImage(variant);

    expect(result).toBe('https://example.com/variant-image.jpg');
  });
});
