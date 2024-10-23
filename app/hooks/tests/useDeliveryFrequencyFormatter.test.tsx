import {renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {SellingPlanInterval} from '~/types';
import {useDeliveryFrequencyFormatter} from '../useDeliveryFrequencyFormatter';

const sellingPlansPageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: '',
  endCursor: '',
};

describe('useDeliveryFrequencyFormatter', () => {
  it('should return correct text for multiple delivery frequencies', async () => {
    const {result} = renderHook(() => useDeliveryFrequencyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        deliveryPolicy: {
          interval: SellingPlanInterval.Month,
          intervalCount: 1,
        },
      },
      {
        id: 'gid://shopify/SellingPlan/2',
        deliveryPolicy: {
          interval: SellingPlanInterval.Week,
          intervalCount: 1,
        },
      },
    ];

    const deliveryFrequencyText =
      result.current.sellingPlanDeliveryFrequencyText(
        sellingPlans,
        sellingPlansPageInfo,
      );
    expect(deliveryFrequencyText).toBe('2 delivery frequencies');
  });

  it.each([
    [SellingPlanInterval.Week, 1, 'Every week'],
    [SellingPlanInterval.Week, 2, 'Every 2 weeks'],
    [SellingPlanInterval.Day, 1, 'Every day'],
    [SellingPlanInterval.Day, 2, 'Every 2 days'],
    [SellingPlanInterval.Month, 1, 'Every month'],
    [SellingPlanInterval.Month, 2, 'Every 2 months'],
    [SellingPlanInterval.Year, 1, 'Every year'],
    [SellingPlanInterval.Year, 2, 'Every 2 years'],
  ])(
    'should return correct text for delivery frequency of %s with interval count %i',
    async (interval, intervalCount, expected) => {
      const {result} = renderHook(() => useDeliveryFrequencyFormatter());

      const sellingPlans = [
        {
          id: 'gid://shopify/SellingPlan/1',
          deliveryPolicy: {
            interval,
            intervalCount,
          },
        },
      ];

      const deliveryFrequencyText =
        result.current.sellingPlanDeliveryFrequencyText(
          sellingPlans,
          sellingPlansPageInfo,
        );

      expect(deliveryFrequencyText).toBe(expected);
    },
  );
});
