import {renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useProductCountFormatter} from '../useProductCountFormatter';

describe('useProductCountFormatter', () => {
  it.each([
    [0, 0, [], 'None'],
    [1, 0, ['Product 1'], 'Product 1'],
    [2, 0, ['Product 1', 'Product 2'], '2 products'],
    [0, 2, [], '2 variants'],
  ])(
    'returns correct text for product count %i and variant count %i',
    (productCount, productVariantCount, productTitles, expected) => {
      const {result} = renderHook(() => useProductCountFormatter());

      const sellingPlanGroupProducts = productTitles.map((title, index) => {
        return {
          id: String(index),
          title,
        };
      });
      const productCountText = result.current(
        sellingPlanGroupProducts,
        productCount,
        productVariantCount,
      );
      expect(productCountText).toBe(expected);
    },
  );
});
