import {currencySymbolMap} from './currency-symbol-map';

interface FormatPriceArgs {
  amount?: number | null;
  locale: string;
  currency?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
}

export function formatPrice({
  amount = null,
  locale,
  currency = 'USD',
  currencyDisplay = 'symbol',
}: FormatPriceArgs): string {
  if (amount === undefined || amount === null) return '-';

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
  });

  return formatter.format(amount);
}

export function getSymbolFromCurrency(currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  let symbol = currencySymbolMap[code];

  if (symbol == undefined) {
    const format = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    });
    let parts = format.formatToParts(1);
    symbol = parts.find((part) => part.type === 'currency')?.value || '$';
  }

  return symbol;
}
