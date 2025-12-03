import {describe, it, expect, vi} from 'vitest';

import {formatPrice, formatPricingPolicy} from '../currencyFormatter';
import type {PricingPolicy} from '../../types';

describe('formatPrice', () => {
  describe('with valid currency codes', () => {
    it('formats USD currency correctly', () => {
      const result = formatPrice(10.99, 'USD');
      expect(result).toMatch(/10.99/);
      expect(result).toContain('$');
    });

    it('formats EUR currency correctly', () => {
      const result = formatPrice(15.5, 'EUR');
      expect(result).toMatch(/15.50|15,50/); // Depending on locale
      expect(result).toMatch(/€/);
    });

    it('formats GBP currency correctly', () => {
      const result = formatPrice(20.0, 'GBP');
      expect(result).toMatch(/20.00|20,00/);
      expect(result).toMatch(/£/);
    });

    it('formats JPY currency correctly (no decimals)', () => {
      const result = formatPrice(1000, 'JPY');
      expect(result).toMatch(/1,?000/); // May or may not have thousand separator
      expect(result).toMatch(/¥|JPY/);
    });

    it('formats CAD currency correctly', () => {
      const result = formatPrice(25.99, 'CAD');
      expect(result).toMatch(/25.99|25,99/);
      expect(result).toMatch(/\$|CA\$|CAD/);
    });
  });

  describe('with different amounts', () => {
    it('formats zero correctly', () => {
      const result = formatPrice(0, 'USD');
      expect(result).toMatch(/0.00|0,00/);
      expect(result).toContain('$');
    });

    it('formats negative amounts correctly', () => {
      const result = formatPrice(-10.5, 'USD');
      expect(result).toMatch(/10.50|10,50/);
      // Negative format varies by locale (could be -$10.50, ($10.50), $-10.50, etc.)
      expect(result).toMatch(/\$|USD/);
    });

    it('formats large amounts correctly', () => {
      const result = formatPrice(1234567.89, 'USD');
      expect(result).toMatch(/1.?234.?567.89|1.?234.?567,89/);
      expect(result).toContain('$');
    });

    it('rounds to 2 decimal places', () => {
      const result = formatPrice(10.999, 'USD');
      // Should round to 11.00
      expect(result).toMatch(/11.00|11,00/);
    });

    it('handles very small amounts', () => {
      const result = formatPrice(0.01, 'USD');
      expect(result).toMatch(/0.01|0,01/);
      expect(result).toContain('$');
    });
  });

  describe('error handling', () => {
    it('falls back gracefully with invalid currency code', () => {
      const result = formatPrice(10.5, 'INVALID' as any);
      expect(result).toBe('INVALID 10.50');
    });

    it('falls back gracefully with null currency code', () => {
      const result = formatPrice(10.5, null as any);
      expect(result).toBe('10.50');
    });

    it('falls back gracefully with undefined currency code', () => {
      const result = formatPrice(10.5, undefined as any);
      expect(result).toBe('10.50');
    });

    it('handles NaN amount with fallback', () => {
      const result = formatPrice(NaN, 'USD');
      // Intl.NumberFormat handles NaN, but let's verify it doesn't crash
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('handles Infinity with fallback', () => {
      const result = formatPrice(Infinity, 'USD');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('locale independence', () => {
    it('uses browser locale (not hardcoded)', () => {
      // Mock different locales
      const originalNumberFormat = Intl.NumberFormat;

      // Test that undefined is passed to Intl.NumberFormat
      const mockNumberFormat = vi.fn().mockImplementation(() => ({
        format: vi.fn().mockReturnValue('$10.00'),
      }));

      // @ts-expect-error - Mocking global
      global.Intl.NumberFormat = mockNumberFormat;

      formatPrice(10, 'USD');

      expect(mockNumberFormat).toHaveBeenCalledWith(undefined, {
        style: 'currency',
        currency: 'USD',
      });

      // Restore original
      global.Intl.NumberFormat = originalNumberFormat;
    });
  });

  describe('edge cases', () => {
    it('handles empty string currency code', () => {
      const result = formatPrice(10.5, '' as any);
      expect(result).toBe('10.50');
    });

    it('handles very long decimal numbers', () => {
      const result = formatPrice(10.123456789, 'USD');
      // Should round to 2 decimal places
      expect(result).toMatch(/10.12|10,12/);
    });

    it('handles negative zero', () => {
      const result = formatPrice(-0, 'USD');
      expect(result).toMatch(/0.00|0,00/);
      expect(result).toContain('$');
    });
  });
});

describe('formatPricingPolicy', () => {
  it('should return undefined when pricingPolicy is null', () => {
    const result = formatPricingPolicy(null);
    expect(result).toBeUndefined();
  });

  it('should format percentage pricing policy', () => {
    const pricingPolicy = {
      type: 'PERCENTAGE',
      value: {
        percentage: 10,
      },
    } as PricingPolicy;

    const result = formatPricingPolicy(pricingPolicy);
    expect(result).toEqual(['percentage', '10']);
  });

  it('should format amount pricing policy', () => {
    const pricingPolicy = {
      type: 'PRICE',
      value: {
        amount: 5.99,
        currencyCode: 'USD',
      },
    } as PricingPolicy;

    const result = formatPricingPolicy(pricingPolicy);
    expect(result).toEqual(['amount', '$5.99']);
  });

  it('should format amount pricing policy with different currency', () => {
    const pricingPolicy = {
      type: 'PRICE',
      value: {
        amount: 10.5,
        currencyCode: 'EUR',
      },
    } as PricingPolicy;

    const result = formatPricingPolicy(pricingPolicy);
    expect(result).toEqual(['amount', '€10.50']);
  });
});
