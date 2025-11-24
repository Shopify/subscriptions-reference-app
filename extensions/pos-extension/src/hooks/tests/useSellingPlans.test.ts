import {describe, it, expect, vi, beforeEach} from 'vitest';
import {waitFor} from '@testing-library/preact';
import {renderHookWithContext} from '../../../tests/utils/renderHook';
import {
  mapRemoteSellingPlans,
  mapRemotePricingPolicies,
  useSellingPlans,
} from '../useSellingPlans';

// Mock the GraphQL query function
vi.mock('../../foundation/api/useGraphqlQuery', () => ({
  querySellingPlans: vi.fn(),
}));

// Mock the metrics module
vi.mock('../../metrics/metrics', () => ({
  metric: {
    increment: vi.fn(),
    logError: vi.fn(),
  },
}));

// Import mocked module
import {querySellingPlans} from '../../foundation/api/useGraphqlQuery';
const mockedQuerySellingPlans = querySellingPlans as ReturnType<typeof vi.fn>;

describe('useSellingPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return idle state when variantId is undefined', () => {
    const {result} = renderHookWithContext(() => useSellingPlans(undefined));

    expect(result.current.sellingPlansState.status).toBe('idle');
  });

  it('should fetch selling plans successfully', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'Subscription Group',
                  appId: 'gid://shopify/App/66228322305',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/123',
                        name: 'Weekly Delivery',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [
                          {
                            adjustmentType: 'PERCENTAGE',
                            adjustmentValue: {
                              __typename:
                                'SellingPlanPricingPolicyPercentageValue',
                              percentage: 10,
                            },
                          },
                        ],
                      },
                      {
                        id: 'gid://shopify/SellingPlan/456',
                        name: 'Monthly Delivery',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [
                          {
                            adjustmentType: 'PRICE',
                            adjustmentValue: {
                              __typename: 'MoneyV2',
                              amount: 5.0,
                              currencyCode: 'USD',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(12345));

    // Initially should be loading
    expect(result.current.sellingPlansState.status).toBe('loading');

    // Wait for the hook to fetch data
    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      expect(result.current.sellingPlansState.data).toHaveLength(1);
      expect(result.current.sellingPlansState.data[0].name).toBe(
        'Subscription Group',
      );
      expect(result.current.sellingPlansState.data[0].plans).toHaveLength(2);
      expect(result.current.sellingPlansState.data[0].plans[0].name).toBe(
        'Weekly Delivery',
      );
      expect(
        result.current.sellingPlansState.data[0].plans[0].pricingPolicy,
      ).toEqual({
        type: 'PERCENTAGE',
        value: {percentage: 10},
      });
      expect(result.current.sellingPlansState.data[0].plans[1].name).toBe(
        'Monthly Delivery',
      );
      expect(
        result.current.sellingPlansState.data[0].plans[1].pricingPolicy,
      ).toEqual({
        type: 'PRICE',
        value: {amount: 5.0, currencyCode: 'USD'},
      });
    }
  });

  it('should handle GraphQL errors', async () => {
    const mockResponse = {
      data: {},
      errors: [
        {
          message: 'GraphQL error: Product variant not found',
        },
      ],
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(99999));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('error');
    });

    if (result.current.sellingPlansState.status === 'error') {
      expect(result.current.sellingPlansState.error).toBe(
        'GraphQL error: Product variant not found',
      );
    }
  });

  it('should handle missing product variant', async () => {
    const mockResponse = {
      data: {
        productVariant: null,
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(88888));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('error');
    });

    if (result.current.sellingPlansState.status === 'error') {
      expect(result.current.sellingPlansState.error).toBe(
        'Product variant not found',
      );
    }
  });

  it('should handle network errors', async () => {
    mockedQuerySellingPlans.mockRejectedValue(new Error('Network error'));

    const {result} = renderHookWithContext(() => useSellingPlans(77777));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('error');
    });

    if (result.current.sellingPlansState.status === 'error') {
      expect(result.current.sellingPlansState.error).toBe('Network error');
    }
  });

  it('should handle non-Error exceptions', async () => {
    mockedQuerySellingPlans.mockRejectedValue('String error');

    const {result} = renderHookWithContext(() => useSellingPlans(66666));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('error');
    });

    if (result.current.sellingPlansState.status === 'error') {
      expect(result.current.sellingPlansState.error).toBe(
        'Failed to fetch selling plans',
      );
    }
  });

  it('should refetch when variantId changes', async () => {
    const firstMockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'First Group',
                  appId: 'gid://shopify/App/66228322305',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/111',
                        name: 'First Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    const secondMockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'Second Group',
                  appId: 'gid://shopify/App/66228322305',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/222',
                        name: 'Second Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    mockedQuerySellingPlans
      .mockResolvedValueOnce(firstMockResponse)
      .mockResolvedValueOnce(secondMockResponse);

    let variantId: number | undefined = 11111;
    const {result, rerender} = renderHookWithContext(() =>
      useSellingPlans(variantId),
    );

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      expect(result.current.sellingPlansState.data[0].name).toBe('First Group');
    }

    // Change variant ID
    variantId = 22222;
    rerender();

    // Should start loading again
    expect(result.current.sellingPlansState.status).toBe('loading');

    // Wait for second fetch
    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      expect(result.current.sellingPlansState.data[0].name).toBe(
        'Second Group',
      );
    }

    expect(mockedQuerySellingPlans).toHaveBeenCalledTimes(2);
  });

  it('should reset to idle when variantId becomes undefined', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'Test Group',
                  appId: 'gid://shopify/App/66228322305',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/333',
                        name: 'Test Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    let variantId: number | undefined = 33333;
    const {result, rerender} = renderHookWithContext(() =>
      useSellingPlans(variantId),
    );

    // Wait for fetch
    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    // Change variant ID to undefined
    variantId = undefined;
    rerender();

    // Should reset to idle
    expect(result.current.sellingPlansState.status).toBe('idle');
  });

  it('should handle empty selling plan groups', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [],
          },
        },
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(44444));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      expect(result.current.sellingPlansState.data).toEqual([]);
    }
  });

  it('should filter selling plan groups by appId (only include groups with subscriptions app ID)', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'Shopify Subscriptions Group',
                  appId: 'gid://shopify/App/66228322305', // This should be included
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/111',
                        name: 'Weekly Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
              {
                node: {
                  name: 'Third Party App Group',
                  appId: 'gid://shopify/App/123456', // This should be filtered out
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/222',
                        name: 'Monthly Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
              {
                node: {
                  name: 'Another Shopify Group',
                  appId: 'gid://shopify/App/66228322305', // This should be included
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/333',
                        name: 'Yearly Plan',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(55555));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      // Should only have 2 groups (the ones with subscriptions app ID)
      expect(result.current.sellingPlansState.data).toHaveLength(2);
      expect(result.current.sellingPlansState.data[0].name).toBe(
        'Shopify Subscriptions Group',
      );
      expect(result.current.sellingPlansState.data[1].name).toBe(
        'Another Shopify Group',
      );

      // Verify the third party app group was filtered out
      const groupNames = result.current.sellingPlansState.data.map(
        (group) => group.name,
      );
      expect(groupNames).not.toContain('Third Party App Group');
    }
  });

  it('should return empty array when all selling plan groups do not have subscriptions app ID', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          sellingPlanGroups: {
            edges: [
              {
                node: {
                  name: 'Third Party App Group 1',
                  appId: 'gid://shopify/App/111111',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/444',
                        name: 'Plan A',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
              {
                node: {
                  name: 'Third Party App Group 2',
                  appId: 'gid://shopify/App/222222',
                  sellingPlans: {
                    nodes: [
                      {
                        id: 'gid://shopify/SellingPlan/555',
                        name: 'Plan B',
                        category: 'SUBSCRIPTION',
                        pricingPolicies: [],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    };

    mockedQuerySellingPlans.mockResolvedValue(mockResponse);

    const {result} = renderHookWithContext(() => useSellingPlans(66666));

    await waitFor(() => {
      expect(result.current.sellingPlansState.status).toBe('success');
    });

    if (result.current.sellingPlansState.status === 'success') {
      // Should have no groups since none have subscriptions app ID
      expect(result.current.sellingPlansState.data).toEqual([]);
    }
  });
});

describe('mapRemoteSellingPlans', () => {
  it('should return empty array for empty input', () => {
    const result = mapRemoteSellingPlans([]);
    expect(result).toEqual([]);
  });

  it('should map a single selling plan without pricing policies', () => {
    const planNodes = [
      {
        id: 'gid://shopify/SellingPlan/123',
        name: 'Weekly Subscription',
        category: 'SUBSCRIPTION',
        pricingPolicies: [],
      },
    ] as any;

    const result = mapRemoteSellingPlans(planNodes);

    expect(result).toEqual([
      {
        id: 123,
        name: 'Weekly Subscription',
        pricingPolicy: null,
      },
    ]);
  });

  it('should map multiple selling plans', () => {
    const planNodes = [
      {
        id: 'gid://shopify/SellingPlan/123',
        name: 'Weekly Subscription',
        category: 'SUBSCRIPTION',
        pricingPolicies: [],
      },
      {
        id: 'gid://shopify/SellingPlan/456',
        name: 'Monthly Subscription',
        category: 'SUBSCRIPTION',
        pricingPolicies: [],
      },
    ] as any;

    const result = mapRemoteSellingPlans(planNodes);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(123);
    expect(result[0].name).toBe('Weekly Subscription');
    expect(result[1].id).toBe(456);
    expect(result[1].name).toBe('Monthly Subscription');
  });

  it('should skip nodes without id', () => {
    const planNodes = [
      {
        id: null,
        name: 'Invalid Plan',
        category: 'SUBSCRIPTION',
        pricingPolicies: [],
      },
      {
        id: 'gid://shopify/SellingPlan/789',
        name: 'Valid Plan',
        category: 'SUBSCRIPTION',
        pricingPolicies: [],
      },
    ] as any;

    const result = mapRemoteSellingPlans(planNodes);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(789);
    expect(result[0].name).toBe('Valid Plan');
  });

  it('should map selling plan with percentage pricing policy', () => {
    const planNodes = [
      {
        id: 'gid://shopify/SellingPlan/123',
        name: 'Weekly Subscription',
        category: 'SUBSCRIPTION',
        pricingPolicies: [
          {
            adjustmentType: 'PERCENTAGE',
            adjustmentValue: {
              __typename: 'SellingPlanPricingPolicyPercentageValue',
              percentage: 10,
            },
          },
        ],
      },
    ] as any;

    const result = mapRemoteSellingPlans(planNodes);

    expect(result[0].pricingPolicy).toEqual({
      type: 'PERCENTAGE',
      value: {
        percentage: 10,
      },
    });
  });

  it('should map selling plan with amount pricing policy', () => {
    const planNodes = [
      {
        id: 'gid://shopify/SellingPlan/123',
        name: 'Weekly Subscription',
        category: 'SUBSCRIPTION',
        pricingPolicies: [
          {
            adjustmentType: 'PRICE',
            adjustmentValue: {
              __typename: 'MoneyV2',
              amount: 5.99,
              currencyCode: 'USD',
            },
          },
        ],
      },
    ] as any;

    const result = mapRemoteSellingPlans(planNodes);

    expect(result[0].pricingPolicy).toEqual({
      type: 'PRICE',
      value: {
        amount: 5.99,
        currencyCode: 'USD',
      },
    });
  });
});

describe('mapRemotePricingPolicies', () => {
  it('should return null for empty pricing policies array', () => {
    const result = mapRemotePricingPolicies([]);
    expect(result).toBeNull();
  });

  it('should map MoneyV2 pricing policy', () => {
    const pricingPolicies = [
      {
        adjustmentType: 'PRICE',
        adjustmentValue: {
          __typename: 'MoneyV2',
          amount: 10.5,
          currencyCode: 'EUR',
        },
      },
    ] as any;

    const result = mapRemotePricingPolicies(pricingPolicies);

    expect(result).toEqual({
      type: 'PRICE',
      value: {
        amount: 10.5,
        currencyCode: 'EUR',
      },
    });
  });

  it('should map percentage pricing policy', () => {
    const pricingPolicies = [
      {
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: {
          __typename: 'SellingPlanPricingPolicyPercentageValue',
          percentage: 15,
        },
      },
    ] as any;

    const result = mapRemotePricingPolicies(pricingPolicies);

    expect(result).toEqual({
      type: 'PERCENTAGE',
      value: {
        percentage: 15,
      },
    });
  });

  it('should only use the first pricing policy when multiple exist', () => {
    const pricingPolicies = [
      {
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: {
          __typename: 'SellingPlanPricingPolicyPercentageValue',
          percentage: 10,
        },
      },
      {
        adjustmentType: 'PRICE',
        adjustmentValue: {
          __typename: 'MoneyV2',
          amount: 5.0,
          currencyCode: 'USD',
        },
      },
    ] as any;

    const result = mapRemotePricingPolicies(pricingPolicies);

    // Should only map the first policy
    expect(result).toEqual({
      type: 'PERCENTAGE',
      value: {
        percentage: 10,
      },
    });
  });

  it('should return null for unknown pricing policy type', () => {
    const pricingPolicies = [
      {
        adjustmentType: 'UNKNOWN',
        adjustmentValue: {
          __typename: 'UnknownType',
          someValue: 123,
        },
      },
    ] as any;

    const result = mapRemotePricingPolicies(pricingPolicies);

    expect(result).toBeNull();
  });

  it('should handle different adjustment types correctly', () => {
    const percentagePolicy = [
      {
        adjustmentType: 'FIXED_AMOUNT',
        adjustmentValue: {
          __typename: 'MoneyV2',
          amount: 3.0,
          currencyCode: 'CAD',
        },
      },
    ] as any;

    const result = mapRemotePricingPolicies(percentagePolicy);

    expect(result).toEqual({
      type: 'FIXED_AMOUNT',
      value: {
        amount: 3.0,
        currencyCode: 'CAD',
      },
    });
  });
});
