import type {ApiForRenderExtension} from '@shopify/ui-extensions-react/customer-account';

export type FullPageExtensionApi =
  ApiForRenderExtension<'customer-account.page.render'>;

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'
  | 'STALE';

export type SubscriptionInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type CountPrecision = 'EXACT' | 'AT_LEAST';

export interface Count {
  count: number;
  precision: CountPrecision;
}

export interface DeliveryPolicy {
  interval: SubscriptionInterval;
  intervalCount?: Count | null;
}

export interface CustomerCreditCard {
  id: string;
  brand: string;
  walletType?: string | null;
  lastDigits: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaypalBillingAgreement {
  id: string;
  paypalAccountEmail?: string | null;
}

export type PaymentInstrument = CustomerCreditCard | PaypalBillingAgreement;

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface BillingCycle {
  billingAttemptExpectedDate: string;
  cycleIndex: number;
  skipped: boolean;
}
export interface UserError {
  field?: string[] | null;
  message: string;
}

export interface SubscriptionContractDetails {
  id: string;
  status: SubscriptionStatus;
  deliveryPolicy: DeliveryPolicy;
  priceBreakdownEstimate?: PriceBreakdown;
  upcomingBillingCycles: BillingCycle[];
  paymentInstrument?: PaymentInstrument;
  shippingMethodTitle?: string | null;
  deliveryMethod?: SubscriptionDeliveryMethod;
  pickupAddress?: ShippingAddress;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  lines: SubscriptionLine[];
  orders: SubscriptionOrder[];
  lastOrderPrice: Money;
}

export interface SubscriptionLine {
  id: string;
  name: string;
  title: string;
  variantTitle?: string | null;
  quantity: number;
  image?: {
    id?: string | null;
    altText?: string | null;
    url: string;
  };
}

export interface SubscriptionOrder {
  id: string;
  createdAt: string;
  totalPrice: Money;
}

export interface PriceBreakdown {
  subtotalPrice: Money;
  totalTax: Money;
  totalShippingPrice: Money;
  totalPrice: Money;
}

export interface CustomerAddress {
  firstName?: string | null;
  lastName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  provinceCode?: string | null;
  zip?: string | null;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  phone: string;
  country: string;
  province: string;
  zip: string;
}

export interface BillingAddress {
  address1: string;
  address2: string;
  city: string;
  country: string;
  province: string;
  zip: string;
}

export type SubscriptionDeliveryMethod =
  | ShippingDeliveryMethod
  | LocalDeliveryMethod
  | PickupDeliveryMethod;

export type PickupAddress = Omit<CustomerAddress, 'firstName' | 'lastName'>;

export interface ShippingDeliveryMethod {
  address: CustomerAddress;
  shippingOption: {
    presentmentTitle?: string | null;
  };
}

export interface LocalDeliveryMethod {
  address: CustomerAddress;
  localDeliveryOption: {
    presentmentTitle?: string | null;
  };
}

export interface PickupDeliveryMethod {
  pickupOption: {
    pickupAddress: PickupAddress;
  };
}

export type DeliveryOptionsResult =
  | DeliveryOptionsResultSuccess
  | DeliveryOptionsResultFailure;

export interface DeliveryOptionsResultSuccess {
  token: string;
  deliveryOptions: DeliveryOption[];
}

export interface DeliveryOptionsResultFailure {
  message?: string | null;
}

export type DeliveryOption = ShippingOption | PickupOption;

export interface ShippingOption {
  __typename: string;
  code: string;
  title: string;
  presentmentTitle?: string | null;
  description?: string | null;
  phoneRequired: boolean;
  price: Money;
}

// Local delivery and shipping have the exact same fields
export type LocalDeliveryOption = ShippingOption;

export interface PickupOption {
  __typename: string;
  code: string;
  title: string;
  locationId: string;
  presentmentTitle?: string | null;
  description?: string | null;
  phoneRequired: boolean;
  pickupTime: string;
  pickupAddress: PickupAddress;
  price: Money;
}
