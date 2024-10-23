import {renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {SellingPlanInterval} from '~/types';
import {SellingPlanAdjustment} from '~/types/plans';
import {usePricingPolicyFormatter} from '../usePricingPolicyFormatter';

const sellingPlansPageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: '',
  endCursor: '',
};

const deliveryPolicy = {
  interval: SellingPlanInterval.Month,
  intervalCount: 1,
};

const deliveryPolicy2 = {
  interval: SellingPlanInterval.Week,
  intervalCount: 2,
};

describe('usePricingPolicyFormatter', () => {
  it('should return correct text for no discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        deliveryPolicy: {
          interval: SellingPlanInterval.Week,
          intervalCount: 1,
        },
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('No discount');
  });

  it('should return correct text for percentage discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Percentage,
            adjustmentValue: {
              percentage: 20,
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('20% off');
  });

  it('should return correct text for ranged percentage discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Percentage,
            adjustmentValue: {
              percentage: 20,
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
      {
        id: 'gid://shopify/SellingPlan/2',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Percentage,
            adjustmentValue: {
              percentage: 30,
            },
          },
        ],
        deliveryPolicy: deliveryPolicy2,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('20-30% off');
  });

  it('should return correct text for fixed discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Fixed,
            adjustmentValue: {
              amount: 100.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('CA$100.00 off');
  });

  it('should return correct text for ranged fixed amount discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Fixed,
            adjustmentValue: {
              amount: 100.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
      {
        id: 'gid://shopify/SellingPlan/2',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Fixed,
            adjustmentValue: {
              amount: 200.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy2,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('CA$100.00-CA$200.00 off');
  });

  it('should return correct text for price discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Price,
            adjustmentValue: {
              amount: 100.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('CA$100.00');
  });

  it('should return correct text for ranged fixed amount discount', () => {
    const {result} = renderHook(() => usePricingPolicyFormatter());

    const sellingPlans = [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Price,
            adjustmentValue: {
              amount: 100.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
      {
        id: 'gid://shopify/SellingPlan/2',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Price,
            adjustmentValue: {
              amount: 200.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: deliveryPolicy,
      },
    ];

    const pricingPolicyText = result.current(
      sellingPlans,
      sellingPlansPageInfo,
    );
    expect(pricingPolicyText).toBe('CA$100.00-CA$200.00');
  });
});
