import {describe, it, expect, vi, beforeEach} from 'vitest';
import {querySellingPlans} from '../useGraphqlQuery';
import SellingPlansQuery from '../../../graphql/SellingPlansQuery';

describe('querySellingPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('calls fetch with correct URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({data: {}, errors: null}),
    });

    await querySellingPlans(123456);

    expect(global.fetch).toHaveBeenCalledWith(
      'shopify:admin/api/graphql.json',
      expect.any(Object),
    );
  });

  it('sends correct request body with GraphQL query', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({data: {}, errors: null}),
    });

    await querySellingPlans(123456);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: SellingPlansQuery,
          variables: {variantId: 'gid://shopify/ProductVariant/123456'},
        }),
      }),
    );
  });

  it('formats variant ID as GID correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({data: {}, errors: null}),
    });

    await querySellingPlans(789);

    const callArgs = (global.fetch as any).mock.calls[0][1];
    const body = JSON.parse(callArgs.body);

    expect(body.variables.variantId).toBe('gid://shopify/ProductVariant/789');
  });

  it('returns the JSON response', async () => {
    const mockResponse = {
      data: {
        productVariant: {
          id: 'gid://shopify/ProductVariant/123456',
          sellingPlanGroups: {edges: []},
        },
      },
      errors: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await querySellingPlans(123456);

    expect(result).toEqual(mockResponse);
  });

  it('handles fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(querySellingPlans(123456)).rejects.toThrow('Network error');
  });

  it('handles non-JSON responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(querySellingPlans(123456)).rejects.toThrow('Invalid JSON');
  });
});
