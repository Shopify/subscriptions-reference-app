import {Image} from '@shopify/polaris';
import styles from './PaymentIcon.module.css';

export const PAYMENT_BRANDS = {
  americanexpress: 'americanexpress',
  applepay: 'applepay',
  bogus: 'bogus',
  dankort: 'dankort',
  dinersclub: 'dinersclub',
  discover: 'discover',
  elo: 'elo',
  forbrugsforeningen: 'forbrugsforeningen',
  googlepay: 'googlepay',
  hypercard: 'hypercard',
  jcb: 'jcb',
  laser: 'laser',
  maestro: 'maestro',
  mastercard: 'mastercard',
  paypal: 'paypal',
  paypalexpress: 'paypal',
  shoppay: 'shoppay',
  unionpay: 'unionpay',
  visa: 'visa',
  visaelectron: 'visaelectron',
};
export type PaymentMethodName = keyof typeof PAYMENT_BRANDS;

export interface PaymentIconProps {
  brand: PaymentMethodName | string;
}

const hasPaymentMethodIcon = (brand: string) => brand in PAYMENT_BRANDS;

export default function PaymentIcon({brand}: PaymentIconProps) {
  const source = hasPaymentMethodIcon(brand)
    ? `/images/paymentIcons/${PAYMENT_BRANDS[brand]}.svg`
    : `/images/paymentIcons/generic.svg`;

  return <Image source={source} alt={brand} className={styles.PaymentIcon} />;
}
