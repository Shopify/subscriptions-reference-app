import type {PaymentInstrument as PaymentInstrumentType} from 'types';
import {
  Text,
  PaymentIcon,
  InlineStack,
} from '@shopify/ui-extensions-react/customer-account';
import {brandLabels} from 'utilities/constants';

export interface PaymentInstrumentProps {
  paymentInstrument?: PaymentInstrumentType;
}

export function PaymentInstrument({paymentInstrument}: PaymentInstrumentProps) {
  if (!paymentInstrument) return null;

  const isCreditCard = 'brand' in paymentInstrument;
  const brand = isCreditCard ? paymentInstrument.brand : 'paypal';
  // removes everything but letters and numbers
  const formattedBrandKey = brand.toLowerCase().replace(/[^a-z0-9]+/gi, '');
  const brandLabel = brandLabels.get(formattedBrandKey);
  const wallet = isCreditCard ? paymentInstrument.walletType : null;
  const iconBrand = wallet ? wallet : brand;

  let label = '';

  if (isCreditCard) {
    label = brandLabel
      ? `${brandLabel} •••• ${paymentInstrument.lastDigits}`
      : `•••• ${paymentInstrument.lastDigits}`;
  } else {
    label = `${brandLabel} ${paymentInstrument.paypalAccountEmail}`;
  }

  return (
    <InlineStack spacing="extraTight">
      <PaymentIcon name={iconBrand} />
      <Text>{label}</Text>
    </InlineStack>
  );
}
