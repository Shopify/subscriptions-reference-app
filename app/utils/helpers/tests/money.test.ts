import {describe, expect, it} from 'vitest';
import {formatPrice, getSymbolFromCurrency} from '../money';

describe('formatPrice', () => {
  it('formats USD correctly', () => {
    const usd = formatPrice({amount: 1000, currency: 'USD', locale: 'en'});
    expect(usd).toBe('$1,000.00');
  });

  it('formats EUR correctly', () => {
    const eur = formatPrice({amount: 1000, currency: 'EUR', locale: 'en'});
    expect(eur).toBe('€1,000.00');
  });

  it('formats JPY correctly', () => {
    const jpy = formatPrice({amount: 1000, currency: 'JPY', locale: 'en'});
    expect(jpy).toBe('¥1,000');
  });

  it('defaults to USD when no currency is provided', () => {
    const defaultCurrency = formatPrice({amount: 1000, locale: 'en'});
    expect(defaultCurrency).toBe('$1,000.00');
  });
});

describe('currency symbol', () => {
  it('should return $ if the sybmol is USD', () => {
    const currency = 'USD';
    expect(getSymbolFromCurrency(currency)).toBe('$');
  });

  it('should return ¥ if the sybmol is JPY', () => {
    const currency = 'JPY';
    expect(getSymbolFromCurrency(currency)).toBe('¥');
  });
});
