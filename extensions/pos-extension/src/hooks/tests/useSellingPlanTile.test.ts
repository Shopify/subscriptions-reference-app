import {describe, it, expect} from 'vitest';
import {act} from '@testing-library/preact';
import {
  mockCartWithNoSellingPlanItems,
  mockCartWithOneSellingPlanItem,
  mockCartWithTwoSellingPlanItems,
  mockLineItem,
  mockLineItemWithSellingPlan,
} from '../../../tests/mocks/cart';
import {renderHookWithContext} from '../../../tests/utils/renderHook';
import {useSellingPlanTile} from '../useSellingPlanTile';
import {mockI18n} from 'extensions/pos-extension/tests/mocks/shopifyI18n';

const SUPPORTED_VERSION = '10.13.0';
const UNSUPPORTED_VERSION = '10.12.0';

describe('useSellingPlanTile', () => {
  describe('title', () => {
    it('should be `Subscriptions`', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithNoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.title).toBe('Subscriptions');
    });
  });

  describe('subtitle', () => {
    it('should be `No subscriptions available` if the cart has no selling plan items', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithNoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.subtitle).toBe('No subscriptions available');
    });

    it('should be `Subscription available for 1 item` (singular) if the cart has 1 selling plan item', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.subtitle).toBe('Subscription available for 1 item');
    });

    it('should be `Subscription available for 1 item` (singular) if the cart has 2 item but only one has selling plans', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          {
            lineItems: [mockLineItem, mockLineItemWithSellingPlan],
            subtotal: '10',
            taxTotal: '1',
            grandTotal: '11',
            cartDiscounts: [],
            properties: {},
          },
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.subtitle).toBe('Subscription available for 1 item');
    });

    it('should be `Subscription available for X items` (plural) if the cart has more than one selling plan item', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithTwoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.subtitle).toBe(
        'Subscription available for 2 items',
      );
    });
  });

  describe('enabled', () => {
    it('should be `false` if the cart has no selling plan items', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithNoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.enabled).toBe(false);
    });

    it('should be `true` if the cart has selling plan items', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.enabled).toBe(true);
    });
  });

  describe('onCartChange', () => {
    it('should be called with the updated cart', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithNoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.enabled).toBe(false);
      expect(result.current.subtitle).toBe('No subscriptions available');

      act(() => {
        result.current.onCartChange(mockCartWithOneSellingPlanItem);
      });
      expect(result.current.enabled).toBe(true);
      expect(result.current.subtitle).toBe('Subscription available for 1 item');

      act(() => {
        result.current.onCartChange(mockCartWithTwoSellingPlanItems);
      });
      expect(result.current.enabled).toBe(true);
      expect(result.current.subtitle).toBe(
        'Subscription available for 2 items',
      );
    });
  });

  describe('version checking', () => {
    it('should show unsupported title and subtitle when version is not supported', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          UNSUPPORTED_VERSION,
        ),
      );
      expect(result.current.title).toBe('Subscriptions unavailable');
      expect(result.current.subtitle).toBe('Requires POS 10.13.0+');
    });

    it('should be disabled when version is not supported even with selling plans', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          UNSUPPORTED_VERSION,
        ),
      );
      expect(result.current.enabled).toBe(false);
    });

    it('should be enabled when version is supported and has selling plans', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.enabled).toBe(true);
    });
  });

  describe('disabledReason', () => {
    it('should be "version-unsupported" when version is not supported', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          UNSUPPORTED_VERSION,
        ),
      );
      expect(result.current.disabledReason).toBe('version-unsupported');
    });

    it('should be "feature-disabled" when no selling plans in cart', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithNoSellingPlanItems,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.disabledReason).toBe('feature-disabled');
    });

    it('should be null when enabled', () => {
      const {result} = renderHookWithContext(() =>
        useSellingPlanTile(
          mockCartWithOneSellingPlanItem,
          mockI18n,
          SUPPORTED_VERSION,
        ),
      );
      expect(result.current.disabledReason).toBe(null);
    });
  });
});
