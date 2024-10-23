import {CustomerCreditCard, PaymentInstrument} from 'types';

export function isCreditCardExpired({
  expiryYear,
  expiryMonth,
}: {
  expiryYear: number;
  expiryMonth: number;
}) {
  return new Date(Date.UTC(expiryYear, expiryMonth, 1)).getTime() < Date.now();
}

export function paymentInstrumentIsCreditCard(
  paymentInstrument: PaymentInstrument,
): paymentInstrument is CustomerCreditCard {
  return 'brand' in paymentInstrument;
}
