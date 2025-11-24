import type {Session} from '@shopify/ui-extensions/point-of-sale';
import type {CurrencyCode} from 'extensions/pos-extension/types/admin.types';
import {PricingPolicy} from '../types';

type PricingPolicyType = 'percentage' | 'amount';

/**
 * Formats a price with the appropriate currency symbol
 */
export function formatPrice(
  amount: number,
  currencyCode: CurrencyCode | Session['currency'],
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return currencyCode
      ? `${currencyCode} ${amount.toFixed(2)}`
      : amount.toFixed(2);
  }
}

export const formatPricingPolicy = (
  pricingPolicy: PricingPolicy | null,
): [PricingPolicyType, string] | undefined => {
  if (!pricingPolicy) {
    return;
  }

  if ('percentage' in pricingPolicy.value) {
    return ['percentage', pricingPolicy.value.percentage.toString()];
  }

  if ('amount' in pricingPolicy.value) {
    return [
      'amount',
      formatPrice(pricingPolicy.value.amount, pricingPolicy.value.currencyCode),
    ];
  }
};
