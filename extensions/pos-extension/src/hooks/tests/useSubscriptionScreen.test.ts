import {describe, it, expect, vi, beforeEach} from 'vitest';
import {act} from '@testing-library/preact';
import {renderHookWithContext} from '../../../tests/utils/renderHook';
import useSubscriptionScreen from '../useSubscriptionScreen';
import {
  CartApiContent,
  LineItem,
  ProductSearchApiContent,
  SessionApiContent,
} from '@shopify/ui-extensions/point-of-sale';
import {useSellingPlans} from '../useSellingPlans';
import {useProductVariant} from '../useProductVariant';
import {SellingPlan} from '../../types';

// Mock the hooks used by useSubscriptionScreen
vi.mock('../useSellingPlans', () => ({
  useSellingPlans: vi.fn(),
}));

vi.mock('../useProductVariant', () => ({
  useProductVariant: vi.fn(),
}));

vi.mock('../../utils/currencyFormatter', () => ({
  formatPrice: vi.fn(
    (price: string, currency: string) => `${currency} ${price}`,
  ),
}));

// Mock the metrics module
vi.mock('../../metrics/metrics', () => ({
  metric: {
    increment: vi.fn(),
    logError: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

const mockedUseSellingPlans = useSellingPlans as ReturnType<typeof vi.fn>;
const mockedUseProductVariant = useProductVariant as ReturnType<typeof vi.fn>;

// Mock API objects
const mockCartApi = {
  addLineItemSellingPlan: vi.fn(),
  removeLineItemSellingPlan: vi.fn(),
} as any as CartApiContent;

const mockProductSearch: ProductSearchApiContent = {
  fetchProductVariantWithId: vi.fn(),
} as any;

const mockSession: SessionApiContent = {
  currentSession: {
    currency: 'USD',
  },
} as any;

const mockWindow = vi.mocked({
  close: vi.fn(),
});
(globalThis as any).window = mockWindow;

// Mock data
const mockLineItem = {
  uuid: 'line-item-123',
  variantId: 12345,
  price: 29.99,
  quantity: 1,
  productId: 1,
  title: 'Test Product',
  imageUrl: 'https://example.com/image.jpg',
  discounts: [],
  taxable: true,
  taxLines: [],
  properties: [],
  isGiftCard: false,
} as unknown as LineItem;

const mockSellingPlan: SellingPlan = {
  id: 123,
  name: 'Weekly Subscription',
  pricingPolicy: {
    type: 'PERCENTAGE' as any,
    value: {percentage: 10},
  },
};

const mockSellingPlansState = {
  status: 'success' as const,
  data: [
    {
      name: 'Subscription Group',
      plans: [mockSellingPlan],
    },
  ],
};

const mockVariantState = {
  status: 'success' as const,
  data: {
    id: 12345,
    title: 'Test Product - Large',
    price: '29.99',
    product: {
      id: 1,
      title: 'Test Product',
    },
  },
};

describe('useSubscriptionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockedUseSellingPlans.mockReturnValue({
      sellingPlansState: {status: 'idle'},
      fetchSellingPlans: vi.fn(),
    });
    mockedUseProductVariant.mockReturnValue({status: 'idle'});
  });

  it('should return initial state when lineItem is undefined', () => {
    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        undefined,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.sellingPlansState.status).toBe('idle');
    expect(result.current.variantState.status).toBe('idle');
    expect(result.current.selectedPlan).toBeUndefined();
    expect(result.current.oneTimePurchasePrice).toBeUndefined();
  });

  it('should fetch selling plans and variant when lineItem is provided', () => {
    mockedUseSellingPlans.mockReturnValue({
      sellingPlansState: mockSellingPlansState,
      fetchSellingPlans: vi.fn(),
    });
    mockedUseProductVariant.mockReturnValue(mockVariantState);

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(mockedUseSellingPlans).toHaveBeenCalledWith(12345);
    expect(mockedUseProductVariant).toHaveBeenCalledWith(
      12345,
      mockProductSearch,
    );
    expect(result.current.sellingPlansState).toEqual(mockSellingPlansState);
    expect(result.current.variantState).toEqual(mockVariantState);
    expect(result.current.oneTimePurchasePrice).toBe('USD 29.99');
  });

  it('should handle selectedPlan state changes', () => {
    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.selectedPlan).toBeUndefined();

    // Select a plan
    act(() => {
      result.current.setSelectedPlan(mockSellingPlan);
    });
    expect(result.current.selectedPlan).toEqual(mockSellingPlan);

    // Deselect plan (back to one-time purchase)
    act(() => {
      result.current.setSelectedPlan(undefined);
    });
    expect(result.current.selectedPlan).toBeUndefined();
  });

  it('should apply selected selling plan when handleApplyPress is called', async () => {
    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    // Select a plan
    act(() => {
      result.current.setSelectedPlan(mockSellingPlan);
    });

    // Apply the plan
    await act(async () => {
      await result.current.handleApplyPress();
    });

    expect((mockCartApi as any).addLineItemSellingPlan).toHaveBeenCalledWith({
      lineItemUuid: 'line-item-123',
      sellingPlanId: 123,
      sellingPlanName: 'Weekly Subscription',
    });
    expect(mockWindow.close).toHaveBeenCalled();
  });

  it('should remove selling plan when no plan is selected', async () => {
    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    // Ensure no plan is selected
    result.current.setSelectedPlan(undefined);

    // Apply (remove) the plan
    await result.current.handleApplyPress();

    expect((mockCartApi as any).removeLineItemSellingPlan).toHaveBeenCalledWith(
      'line-item-123',
    );
    expect(mockWindow.close).toHaveBeenCalled();
  });

  it('should not apply anything when lineItem is undefined', async () => {
    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        undefined,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    await result.current.handleApplyPress();

    expect((mockCartApi as any).addLineItemSellingPlan).not.toHaveBeenCalled();
    expect(
      (mockCartApi as any).removeLineItemSellingPlan,
    ).not.toHaveBeenCalled();
    expect(mockWindow.close).not.toHaveBeenCalled();
  });

  it('should handle loading states correctly', () => {
    mockedUseSellingPlans.mockReturnValue({
      sellingPlansState: {status: 'loading'},
      fetchSellingPlans: vi.fn(),
    });
    mockedUseProductVariant.mockReturnValue({status: 'loading'});

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.sellingPlansState.status).toBe('loading');
    expect(result.current.variantState.status).toBe('loading');
  });

  it('should handle error states correctly', () => {
    mockedUseSellingPlans.mockReturnValue({
      sellingPlansState: {
        status: 'error',
        error: 'Failed to fetch selling plans',
      },
      fetchSellingPlans: vi.fn(),
    });
    mockedUseProductVariant.mockReturnValue({
      status: 'error',
      error: 'Failed to fetch variant',
    });

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.sellingPlansState.status).toBe('error');
    expect(result.current.variantState.status).toBe('error');
  });

  it('should handle lineItem with undefined price', () => {
    const lineItemWithoutPrice = {
      ...mockLineItem,
      price: undefined,
    };

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        lineItemWithoutPrice,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.oneTimePurchasePrice).toBeUndefined();
  });

  it('should format price with different currencies', () => {
    const mockSessionEUR = {
      currentSession: {
        currency: 'EUR',
      },
    } as SessionApiContent;

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSessionEUR,
      ),
    );

    expect(result.current.oneTimePurchasePrice).toBe('EUR 29.99');
  });

  it('should update when lineItem changes', () => {
    mockedUseSellingPlans
      .mockReturnValueOnce({
        sellingPlansState: {status: 'loading'},
        fetchSellingPlans: vi.fn(),
      })
      .mockReturnValueOnce({
        sellingPlansState: mockSellingPlansState,
        fetchSellingPlans: vi.fn(),
      });

    mockedUseProductVariant
      .mockReturnValueOnce({status: 'loading'})
      .mockReturnValueOnce(mockVariantState);

    const {result, rerender} = renderHookWithContext(
      ({lineItem}: {lineItem: LineItem | undefined}) =>
        useSubscriptionScreen(
          lineItem,
          mockCartApi,
          mockProductSearch,
          mockSession,
        ),
      {initialProps: {lineItem: mockLineItem}},
    );

    expect(result.current.oneTimePurchasePrice).toBe('USD 29.99');

    const newLineItem = {
      ...mockLineItem,
      variantId: 67890,
      price: 49.99,
    } as LineItem;

    rerender({lineItem: newLineItem});

    expect(mockedUseSellingPlans).toHaveBeenCalledWith(67890);
    expect(mockedUseProductVariant).toHaveBeenCalledWith(
      67890,
      mockProductSearch,
    );
    expect(result.current.oneTimePurchasePrice).toBe('USD 49.99');
  });

  it('should preserve selected plan when re-rendering', () => {
    const {result, rerender} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    // Select a plan
    act(() => {
      result.current.setSelectedPlan(mockSellingPlan);
    });
    expect(result.current.selectedPlan).toEqual(mockSellingPlan);

    // Re-render
    rerender();

    // Plan should still be selected
    expect(result.current.selectedPlan).toEqual(mockSellingPlan);
  });

  it('should handle multiple plan selections', () => {
    const plan1: SellingPlan = {
      id: 1,
      name: 'Plan 1',
      pricingPolicy: null,
    };

    const plan2: SellingPlan = {
      id: 2,
      name: 'Plan 2',
      pricingPolicy: null,
    };

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    // Select plan 1
    act(() => {
      result.current.setSelectedPlan(plan1);
    });
    expect(result.current.selectedPlan).toEqual(plan1);

    // Switch to plan 2
    act(() => {
      result.current.setSelectedPlan(plan2);
    });
    expect(result.current.selectedPlan).toEqual(plan2);

    // Back to one-time purchase
    act(() => {
      result.current.setSelectedPlan(undefined);
    });
    expect(result.current.selectedPlan).toBeUndefined();
  });

  it('should expose fetchSellingPlans for retry functionality', () => {
    const mockFetch = vi.fn();
    mockedUseSellingPlans.mockReturnValue({
      sellingPlansState: {
        status: 'error',
        error: 'Failed to fetch',
      },
      fetchSellingPlans: mockFetch,
    });

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApi,
        mockProductSearch,
        mockSession,
      ),
    );

    expect(result.current.fetchSellingPlans).toBe(mockFetch);

    // Call retry
    act(() => {
      result.current.fetchSellingPlans();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should not dismiss navigation when api call fails', async () => {
    const error = new Error('API Error');
    const mockAddLineItemSellingPlan = vi.fn().mockRejectedValue(error);
    const mockCartApiWithError = {
      ...mockCartApi,
      addLineItemSellingPlan: mockAddLineItemSellingPlan,
    };

    const {result} = renderHookWithContext(() =>
      useSubscriptionScreen(
        mockLineItem,
        mockCartApiWithError,
        mockProductSearch,
        mockSession,
      ),
    );

    act(() => {
      result.current.setSelectedPlan(mockSellingPlan);
    });

    // The hook doesn't have error handling, so errors propagate
    await expect(
      act(async () => {
        await result.current.handleApplyPress();
      }),
    ).rejects.toThrow('API Error');

    expect(mockAddLineItemSellingPlan).toHaveBeenCalled();
    // Navigation.dismiss should NOT be called when there's an error
    expect(mockWindow.close).not.toHaveBeenCalled();
  });
});
