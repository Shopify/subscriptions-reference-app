import {describe, it, expect, vi, beforeEach} from 'vitest';
import {waitFor} from '@testing-library/preact';
import {renderHookWithContext} from '../../../tests/utils/renderHook';
import {useProductVariant} from '../useProductVariant';
import {
  ProductSearchApiContent,
  ProductVariant,
} from '@shopify/ui-extensions/point-of-sale';

// Mock the Shopify UI Extensions API
const mockFetchProductVariantWithId = vi.fn();

// Create a stable mock object
const mockProductSearch = vi.mocked<ProductSearchApiContent>({
  fetchProductVariantWithId: mockFetchProductVariantWithId,
} as any);

describe('useProductVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return idle state when variantId is undefined', () => {
    const {result} = renderHookWithContext(() =>
      useProductVariant(undefined, mockProductSearch),
    );

    expect(result.current.status).toBe('idle');
  });

  it('should fetch product variant successfully', async () => {
    const mockVariant = {
      id: 12345,
      title: 'Test Product - Large',
      price: '29.99',
      sku: 'TEST-SKU-001',
      barcode: '1234567890',
      inventoryQuantity: 100,
      product: {
        id: 1,
        title: 'Test Product',
        vendor: 'Test Vendor',
      },
    };

    mockFetchProductVariantWithId.mockResolvedValue(mockVariant);

    const {result} = renderHookWithContext(() =>
      useProductVariant(12345, mockProductSearch),
    );

    // Initially should be loading
    expect(result.current.status).toBe('loading');

    // Wait for the hook to fetch data
    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(mockVariant);
      expect(result.current.data.id).toBe(12345);
      expect(result.current.data.title).toBe('Test Product - Large');
    }

    expect(mockFetchProductVariantWithId).toHaveBeenCalledWith(12345);
    expect(mockFetchProductVariantWithId).toHaveBeenCalledTimes(1);
  });

  it('should handle variant not found', async () => {
    mockFetchProductVariantWithId.mockResolvedValue(null);

    const {result} = renderHookWithContext(() =>
      useProductVariant(99999, mockProductSearch),
    );

    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Variant not found');
    }
  });

  it('should handle fetch errors', async () => {
    mockFetchProductVariantWithId.mockRejectedValue(new Error('Network error'));

    const {result} = renderHookWithContext(() =>
      useProductVariant(77777, mockProductSearch),
    );

    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Network error');
    }
  });

  it('should handle non-Error exceptions', async () => {
    mockFetchProductVariantWithId.mockRejectedValue('String error');

    const {result} = renderHookWithContext(() =>
      useProductVariant(66666, mockProductSearch),
    );

    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Failed to fetch variant');
    }
  });

  it('should refetch when variantId changes', async () => {
    const firstMockVariant = {
      id: 11111,
      title: 'First Product',
      price: '19.99',
      sku: 'FIRST-001',
      product: {
        id: 1,
        title: 'First',
      },
    };

    const secondMockVariant = {
      id: 22222,
      title: 'Second Product',
      price: '39.99',
      sku: 'SECOND-001',
      product: {
        id: 2,
        title: 'Second',
      },
    };

    mockFetchProductVariantWithId
      .mockResolvedValueOnce(firstMockVariant)
      .mockResolvedValueOnce(secondMockVariant);

    const {result, rerender} = renderHookWithContext(
      ({variantId}: {variantId: number | undefined}) =>
        useProductVariant(variantId, mockProductSearch),
      {initialProps: {variantId: 11111}},
    );

    // Wait for first fetch
    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'success') {
      expect(result.current.data.id).toBe(11111);
      expect(result.current.data.title).toBe('First Product');
    }

    // Change variant ID
    rerender({variantId: 22222});

    // Should start loading again
    expect(result.current.status).toBe('loading');

    // Wait for second fetch
    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'success') {
      expect(result.current.data.id).toBe(22222);
      expect(result.current.data.title).toBe('Second Product');
    }

    expect(mockFetchProductVariantWithId).toHaveBeenCalledTimes(2);
    expect(mockFetchProductVariantWithId).toHaveBeenNthCalledWith(1, 11111);
    expect(mockFetchProductVariantWithId).toHaveBeenNthCalledWith(2, 22222);
  });

  it('should reset to idle when variantId becomes undefined', async () => {
    const mockVariant = {
      id: 33333,
      title: 'Test Product',
      price: '49.99',
      sku: 'TEST-003',
      product: {
        id: 3,
        title: 'Test',
      },
    };

    mockFetchProductVariantWithId.mockResolvedValue(mockVariant);

    const {result, rerender} = renderHookWithContext(
      ({variantId}: {variantId: number | undefined}) =>
        useProductVariant(variantId, mockProductSearch),
      {initialProps: {variantId: 33333}},
    );

    // Wait for fetch
    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'success') {
      expect(result.current.data.id).toBe(33333);
    }

    // Change variant ID to undefined
    rerender({variantId: undefined as unknown as number});

    // Should reset to idle
    expect(result.current.status).toBe('idle');
  });

  it('should handle undefined variant response gracefully', async () => {
    mockFetchProductVariantWithId.mockResolvedValue(undefined);

    const {result} = renderHookWithContext(() =>
      useProductVariant(44444, mockProductSearch),
    );

    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Variant not found');
    }
  });

  it('should handle API timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    mockFetchProductVariantWithId.mockRejectedValue(timeoutError);

    const {result} = renderHookWithContext(() =>
      useProductVariant(55555, mockProductSearch),
    );

    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      {timeout: 3000},
    );

    if (result.current.status === 'error') {
      expect(result.current.error).toBe('Request timeout');
    }
  });

  it('should fetch variant with complex data structure', async () => {
    const complexMockVariant: ProductVariant = {
      id: 67890,
      title: 'Complex Product - XL',
      price: '99.99',
      compareAtPrice: '149.99',
      sku: 'COMPLEX-XL-001',
      barcode: '9876543210',
      displayName: 'Complex Product - XL',
      inventoryAtAllLocations: 50,
      inventoryAtLocation: 50,
      inventoryIsTracked: true,
      inventoryPolicy: 'CONTINUE',
      taxable: true,
      product: {
        id: 100,
        title: 'Complex Product',
        vendor: 'Premium Vendor',
        productType: 'Electronics',
        tags: ['premium', 'electronics', 'featured'],
        featuredImage: 'https://example.com/image1.jpg',
        createdAt: '',
        updatedAt: '',
        description: '',
        descriptionHtml: '',
        isGiftCard: false,
        tracksInventory: false,
        minVariantPrice: '',
        maxVariantPrice: '',
        productCategory: '',
        numVariants: 0,
        totalInventory: 0,
        variants: [],
        options: [],
        hasOnlyDefaultVariant: false,
      },
      options: [
        {name: 'Size', value: 'XL'},
        {name: 'Color', value: 'Black'},
      ],
      createdAt: '',
      updatedAt: '',
      productId: 0,
      position: 0,
    };

    mockFetchProductVariantWithId.mockResolvedValue(complexMockVariant);

    const {result} = renderHookWithContext(() =>
      useProductVariant(67890, mockProductSearch),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    if (result.current.status === 'success') {
      expect(result.current.data).toEqual(complexMockVariant);
      expect(result.current.data!.product!.vendor).toBe('Premium Vendor');
      expect(result.current.data!.options).toHaveLength(2);
      expect(result.current.data!.options).toEqual([
        {name: 'Size', value: 'XL'},
        {name: 'Color', value: 'Black'},
      ]);
    }
  });

  it('should not refetch if variantId remains the same', async () => {
    const mockVariant = {
      id: 12121,
      title: 'Same Product',
      price: '59.99',
      product: {
        id: 12,
        title: 'Product',
      },
    };

    mockFetchProductVariantWithId.mockResolvedValue(mockVariant);

    const {result, rerender} = renderHookWithContext(
      ({variantId}: {variantId: number | undefined}) =>
        useProductVariant(variantId, mockProductSearch),
      {initialProps: {variantId: 12121}},
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    // Rerender with the same variant ID
    rerender({variantId: 12121});

    // Should still be success, not loading
    expect(result.current.status).toBe('success');

    // Should only have been called once
    expect(mockFetchProductVariantWithId).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid variantId changes', async () => {
    const variant1 = {
      id: 1001,
      title: 'Variant 1',
      price: '10.00',
      product: {id: 1, title: 'Product 1'},
    };

    const variant2 = {
      id: 1002,
      title: 'Variant 2',
      price: '20.00',
      product: {id: 2, title: 'Product 2'},
    };

    const variant3 = {
      id: 1003,
      title: 'Variant 3',
      price: '30.00',
      product: {id: 3, title: 'Product 3'},
    };

    mockFetchProductVariantWithId
      .mockResolvedValueOnce(variant1)
      .mockResolvedValueOnce(variant2)
      .mockResolvedValueOnce(variant3);

    const {result, rerender} = renderHookWithContext(
      ({variantId}: {variantId: number | undefined}) =>
        useProductVariant(variantId, mockProductSearch),
      {initialProps: {variantId: 1001}},
    );

    // Rapidly change variant IDs
    rerender({variantId: 1002});
    rerender({variantId: 1003});

    // Wait for final fetch
    await waitFor(
      () => {
        expect(result.current.status).toBe('success');
      },
      {timeout: 3000},
    );

    // All three fetches should have been initiated
    expect(mockFetchProductVariantWithId).toHaveBeenCalledTimes(3);
  });
});
