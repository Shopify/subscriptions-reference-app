import type {Address} from '@shopify/address';
import type {CountryCode} from 'types/admin.types';
import type {CycleDiscountAdjustmentValue} from '~/routes/app.contracts.$id.edit/validator';
import type {DiscountTypeType} from '~/utils/helpers/zod';
import type {Money, RecurringPolicy} from '.';

export interface SubscriptionContractDetails {
  id: string;
  status: SubscriptionContractStatusType;
  lines: SubscriptionContractDetailsLine[];
  billingPolicy: RecurringPolicy;
  deliveryPolicy: RecurringPolicy;
  nextBillingDate?: string;
  originOrder?: Order | null;
  priceBreakdownEstimate?: PriceBreakdown | null;
  customerPaymentMethod?: CustomerPaymentMethod | null;
  customer?: Customer;
  deliveryMethod?: SubscriptionDeliveryMethod | null;
  billingAttempts: {
    id: string;
  }[];
  lastPaymentStatus?: 'SUCCEEDED' | 'FAILED' | null;
}
export interface SubscriptionContractBillingAttempt {
  id: string;
}

export interface SubscriptionDeliveryMethod {
  name: string;
  isLocalPickup: boolean;
}

export interface ShippingDelivery extends SubscriptionDeliveryMethod {
  shippingOption: {title?: string | null};
  address: Omit<CustomerAddress, 'id'>;
}

export interface LocalDelivery extends SubscriptionDeliveryMethod {
  localDeliveryOption: {
    title?: string | null;
    phone: string;
  };
  address: Omit<CustomerAddress, 'id'>;
}

export interface LocalPickup extends SubscriptionDeliveryMethod {
  pickupOption: {title?: string | null};
}

export interface Customer {
  id: string;
  email?: string | null;
  displayName?: string | null;
  addresses: FormattedAddressWithId[];
}

export interface FormattedAddressWithId {
  id: string;
  address: Address;
}

export interface CustomerAddress {
  id: string;
  formattedArea?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  phone?: string | null;
  countryCode?: CountryCode | null;
  provinceCode?: string | null;
  zip?: string | null;
}

export interface CustomerPaymentMethod {
  id: string;
  instrument?: PaymentInstrument;
  revokedAt?: string | null;
}

export type PaymentInstrument =
  | CustomerCreditCard
  | CustomerShopPayAgreement
  | CustomerPaypalBillingAgreement
  | null;

export interface CustomerCreditCard {
  brand: string;
  lastDigits: string;
  maskedNumber: string;
  expiryYear: number;
  expiryMonth: number;
  expiresSoon: boolean;
  source?: string | null;
}

export type CustomerShopPayAgreement = Omit<
  CustomerCreditCard,
  'brand' | 'source'
>;

export interface CustomerPaypalBillingAgreement {
  paypalAccountEmail?: string | null;
}

export interface Order {
  id: string;
  name: string;
  createdAt: string;
}

export interface PriceBreakdown {
  totalPrice?: Money;
  subtotalPrice: Money;
  totalTax?: Money;
  totalShippingPrice: Money;
}

export interface SubscriptionContractLine {
  id: string;
  title: string;
  variantTitle: string;
  quantity: number;
  productId: string;
  variantId: string;
  currenctPrice: Money;
  variantImage?: {
    altText?: string | null;
    url?: string | null;
  } | null;
  pricingPolicy?: PricingPolicy | null;
  currentOneTimePurchasePrice?: number;
}

export interface SubscriptionContractDetailsLine {
  id: string;
  title: string;
  variantTitle?: string | null;
  quantity: number;
  productId?: string | null;
  variantId?: string | null;
  currentPrice: Money;
  lineDiscountedPrice: Money;
  variantImage?: {
    altText?: string | null;
    url?: string | null;
  } | null;
  pricingPolicy?: ContractDetailsPricingPolicy | null;
  currentOneTimePurchasePrice?: number;
}

export type ContractDetailsPricingPolicy = {
  basePrice: Money;
  cycleDiscounts: ContractDetailsCycleDiscount[];
};

export interface ContractDetailsCycleDiscount {
  adjustmentType: DiscountTypeType;
  adjustmentValue: CycleDiscountAdjustmentValue;
}

export type PricingPolicy = {
  basePrice: Money;
  cycleDiscounts: CycleDiscount[];
};

export interface CycleDiscount {
  adjustmentType: DiscountTypeType;
  adjustmentValue: CycleDiscountAdjustmentValue;
  afterCycle: number;
  computedPrice: Money;
}

export const SubscriptionContractStatus = {
  Cancelled: 'CANCELLED',
  Paused: 'PAUSED',
  Failed: 'FAILED',
  Expired: 'EXPIRED',
  Active: 'ACTIVE',
  Stale: 'STALE',
} as const;

export type SubscriptionContractStatusType =
  (typeof SubscriptionContractStatus)[keyof typeof SubscriptionContractStatus];

export interface SubscriptionContractListItem {
  id: string;
  customer: SubscriptionContractListItemCustomer;
  deliveryPolicy: RecurringPolicy;
  status: SubscriptionContractStatusType;
  totalPrice?: Money;
  lines: SubscriptionContractListItemLine[];
  lineCount: number;
  billingAttempts: BillingAttempt[];
}

export interface SubscriptionContractListItemLine {
  id: string;
  title: string;
  productId?: string;
}

export interface SubscriptionContractListItemCustomer {
  displayName?: string;
}

export interface BillingAttempt {
  id: string;
  errorCode?: string | null;
}
