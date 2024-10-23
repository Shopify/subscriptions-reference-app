import type {TFunction} from 'i18next';

import type {
  CustomerCreditCard,
  CustomerPaypalBillingAgreement,
  CustomerShopPayAgreement,
  PaymentInstrument,
} from '~/types/contracts';

export function paymentInstrumentIsCreditCard(
  instrument: PaymentInstrument,
): instrument is CustomerCreditCard {
  return instrument !== null && 'brand' in instrument;
}

export function paymentInstrumentIsShopPay(
  instrument: PaymentInstrument,
): instrument is CustomerShopPayAgreement {
  return (
    instrument !== null &&
    'lastDigits' in instrument &&
    !('brand' in instrument)
  );
}

export function paymentInstrumentIsPaypal(
  instrument: PaymentInstrument,
): instrument is CustomerPaypalBillingAgreement {
  return instrument !== null && 'paypalAccountEmail' in instrument;
}

/**
 * Formats the expiration date in the format of MM/YY or the localized equivalent
 */
export function formatExpirationDate(
  expirationMonth: number,
  expirationYear: number,
  t: TFunction,
): string {
  const month = expirationMonth.toString().padStart(2, '0');
  // Years are given as 4 digits, but we only want the last 2
  // ex: 2023 -> 23, 2000 -> 00
  const year = (expirationYear % 100).toString().padStart(2, '0');

  return t('paymentMethodDetails.expires', {
    month,
    year,
  });
}

export function formatPaymentBrandName(brand: string) {
  return brand.replace(/[^a-zA-Z0-9]/g, '').toLocaleLowerCase();
}

export function getPaymentInstrumentIconBrand(
  instrument: PaymentInstrument,
): string {
  if (paymentInstrumentIsCreditCard(instrument)) {
    const {source, brand} = instrument;

    if (source) {
      switch (source) {
        case 'google_pay':
          return 'googlepay';
        case 'apple_pay':
          return 'applepay';
        default:
          break;
      }
    }

    return formatPaymentBrandName(brand);
  }

  if (paymentInstrumentIsPaypal(instrument)) {
    return 'paypal';
  }

  if (paymentInstrumentIsShopPay(instrument)) {
    return 'shoppay';
  }

  return 'generic';
}
