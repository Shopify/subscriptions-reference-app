import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {describe, expect, it} from 'vitest';
import {getSelectedResourceCount} from '../utils';

describe('selling plan details utils', () => {
  describe('getSelectedResourceCount', () => {
    it('returns the total number of selected resources for products', () => {
      const selectedProducts = Array.from({length: 10}, (_, index) => ({
        id: composeGid('Product', index + 1),
        title: `Product ${index + 1}`,
        totalVariants: 1,
        variants: [],
      }));

      const result = getSelectedResourceCount(selectedProducts);
      expect(result).toBe(10);
    });

    it('returns the total number of selected resources for individually selected variants', () => {
      const selectedProducts = [
        {
          id: composeGid('Product', 1),
          title: 'Product 1',
          totalVariants: 5,
          variants: [
            {
              id: composeGid('ProductVariant', 1),
              title: 'Variant 1',
            },
            {
              id: composeGid('ProductVariant', 2),
              title: 'Variant 2',
            },
            {
              id: composeGid('ProductVariant', 3),
              title: 'Variant 3',
            },
          ],
        },
        {
          id: composeGid('Product', 2),
          title: 'Product 2',
          totalVariants: 3,
          variants: [
            {
              id: composeGid('ProductVariant', 4),
              title: 'Variant 4',
            },
          ],
        },
      ];

      const result = getSelectedResourceCount(selectedProducts);
      expect(result).toBe(4);
    });

    it('returns the total number of selected resources for a combination of selected products and variants', () => {
      const selectedProducts = [
        {
          id: composeGid('Product', 1),
          title: 'Product 1',
          totalVariants: 5,
          variants: Array.from({length: 5}, (_, index) => ({
            id: composeGid('ProductVariant', index + 1),
            title: `Variant ${index + 1}`,
          })),
        },
        {
          id: composeGid('Product', 2),
          title: 'Product 2',
          totalVariants: 3,
          variants: [
            {
              id: composeGid('ProductVariant', 6),
              title: 'Variant 6',
            },
            {
              id: composeGid('ProductVariant', 7),
              title: 'Variant 7',
            },
          ],
        },
      ];

      const result = getSelectedResourceCount(selectedProducts);
      expect(result).toBe(3);
    });
  });
});
