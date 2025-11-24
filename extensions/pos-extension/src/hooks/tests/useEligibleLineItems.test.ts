import {describe, it, expect, vi, beforeEach} from 'vitest';
import {act, waitFor} from '@testing-library/preact';
import {
  mockCartWithNoSellingPlanItems,
  mockCartWithOneSellingPlanItem,
  mockLineItem,
  mockLineItemWithSellingPlan,
} from '../../../tests/mocks/cart';
import {
  mockProductSearchApiContent,
  mockEmptyProductSearchApiContent,
} from '../../../tests/mocks/productSearch';
import {mockI18n} from '../../../tests/mocks/shopifyI18n';
import {useEligibleLineItems} from '../useEligibleLineItems';
import {renderHookWithContext} from 'extensions/pos-extension/tests/utils/renderHook';

describe('useEligibleLineItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when cart has no selling plan items', async () => {
    const {result} = renderHookWithContext(() =>
      useEligibleLineItems(
        mockCartWithNoSellingPlanItems,
        mockProductSearchApiContent,
        mockI18n,
      ),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toEqual([]);
    }
  });

  it('should map line items with remote variant data correctly', async () => {
    const {result} = renderHookWithContext(() =>
      useEligibleLineItems(
        mockCartWithOneSellingPlanItem,
        mockProductSearchApiContent,
        mockI18n,
      ),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      const item = result.current.state.data[0];
      expect(item).toMatchObject({
        productName: 'Remote Product',
        variantName: 'Remote Variant',
        hasSellingPlan: true,
        subtitle: {
          text: 'Test Selling Plan',
          focused: false,
        },
        image: 'https://example.com/image.jpg',
        data: mockLineItemWithSellingPlan,
      });
    }
  });

  it('should fallback to cart line item data when remote variant is not found', async () => {
    const {result} = renderHookWithContext(() =>
      useEligibleLineItems(
        mockCartWithOneSellingPlanItem,
        mockEmptyProductSearchApiContent,
        mockI18n,
      ),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      const item = result.current.state.data[0];
      expect(item).toMatchObject({
        productName: 'Local Product Title',
        variantName: undefined,
        hasSellingPlan: true,
        image: undefined,
        data: mockLineItemWithSellingPlan,
      });
    }
  });

  it('should show correct subtitle for items requiring selling plans', async () => {
    const cartWithRequiredSellingPlan = {
      ...mockCartWithOneSellingPlanItem,
      lineItems: [
        {
          ...mockLineItem,
          hasSellingPlanGroups: true,
          requiresSellingPlan: true,
          sellingPlan: undefined,
        },
      ],
    };

    const {result} = renderHookWithContext(() =>
      useEligibleLineItems(
        cartWithRequiredSellingPlan,
        mockProductSearchApiContent,
        mockI18n,
      ),
    );

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      const item = result.current.state.data[0];
      expect(item.subtitle).toEqual({
        text: 'Purchase plan required',
        focused: true,
      });
      expect(item.hasSellingPlan).toBe(false);
    }
  });

  it('should update state when cart changes', async () => {
    const {result, rerender} = renderHookWithContext(() =>
      useEligibleLineItems(
        mockCartWithNoSellingPlanItems,
        mockProductSearchApiContent,
        mockI18n,
      ),
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toHaveLength(0);
    }

    // Change cart to have selling plan items
    act(() => {
      result.current.onCartChange(mockCartWithOneSellingPlanItem);
    });

    rerender();

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toHaveLength(1);
      expect(result.current.state.data[0]).toMatchObject({
        data: mockLineItemWithSellingPlan,
        hasSellingPlan: true,
      });
    }
  });
});
