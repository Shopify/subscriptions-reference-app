import type {TypedResponse} from '@remix-run/node';
import type {NodeEnv} from 'config/types';
import type {CurrencyCode, SubscriptionBillingCycle} from 'types/admin.types';
import type {CycleDiscountAdjustmentValue} from '~/routes/app.contracts.$id.edit/validator';
import type {DiscountTypeType} from '~/routes/app.plans.$id/validator';
import type {
  InventoryNotificationFrequencyTypeType,
  OnFailureTypeType,
  OnInventoryFailureTypeType,
} from '~/routes/app.settings._index/validator';
import type {authenticate} from '~/shopify.server';
import type {DeliveryFrequencyIntervalType} from '~/utils/helpers/zod';

export * as Jobs from './jobs';
export * as Webhooks from './webhooks';

export type GraphQLClient = Awaited<
  ReturnType<typeof authenticate.admin>
>['admin']['graphql'];

export type RestClient = Awaited<
  ReturnType<typeof authenticate.admin>
>['admin']['rest'];

export interface Money {
  amount: number;
  currencyCode: string;
}

export interface Toast {
  message: string;
  isError?: boolean;
  duration?: number;
}

export interface ResponseWithToast {
  toast?: Toast;
}

export type TypedResponseWithToast = TypedResponse<ResponseWithToast>;

export type WithToast<T = {}> = T & ResponseWithToast;

export interface ShopLocale {
  locale: string;
  primary: boolean;
}

export interface TranslatableContent {
  key: string;
  value?: string | null;
  digest?: string | null;
  locale: string;
}

export interface TranslationInput {
  key: string;
  value: any;
  translatableContentDigest: string;
  locale: string;
}

export interface TranslationResource {
  resourceId: string;
  translatableContent: TranslatableContent[];
}

export interface SellingPlanGroup {
  merchantCode: string;
  planName: string;
  offerDiscount: string;
  discountType: DiscountTypeType;
  discountDeliveryOptions: DiscountDeliveryOption[];
  products: Product[];
  selectedProductIds: string;
  selectedProductVariantIds: string;
}

export interface DiscountDeliveryOption {
  deliveryFrequency: number;
  deliveryInterval: DeliveryFrequencyIntervalType;
  discountValue?: number;
}

export interface SellingPlan {
  name: string;
  description: string;
  options: string[];
  billingPolicy: RecurringPolicy;
  deliveryPolicy: RecurringPolicy;
}

export interface SellingPlanDetails {
  id: string;
  name: string;
  deliveryPolicy: RecurringPolicy;
  discountType?: DiscountTypeType;
  discountValue?: number;
}

export interface RecurringPolicy {
  interval: SellingPlanInterval;
  intervalCount: number;
}

export interface DeliveryMethod {
  localDelivery?: LocalDelivery;
  shipping?: Shipping;
}

export interface LocalDelivery {
  address: Address;
}

export interface Shipping {
  address: Address;
}

export interface Address {}

export interface SellingPlanGroupProduct {
  id: string;
  title: string;
  featuredImage?: SellingPlanProductImage | null;
  totalVariants?: number;
  areAllvariantsSelected?: boolean;
}

export interface SellingPlanGroupProductVariant {
  id: string;
  title: string;
  product: SellingPlanGroupProduct;
}

export interface SellingPlanProductImage {
  id: string;
  altText?: string | null;
  transformedSrc: string;
}

export interface Product {
  id: string;
  title: string;
  handle?: string;
  images?: Image[];
  variants?: ProductVariant[];
  totalVariants?: number;
  areAllVariantsSelected?: boolean;
}

export interface WebhookQuery {
  id: string;
  topic: string;
  endpoint: string;
}

export interface ProductVariant {
  id?: string;
  title?: string;
  images?: any[];
}

export interface Image {
  originalSrc: string;
  altText?: string;
}

export interface ResourcePickerItem {
  id: string;
  variants?: {id: string}[];
}

export interface PastBillingCycle {
  cycleIndex: number;
  skipped: boolean;
  billingAttemptExpectedDate: string;
  order?: {
    id: string;
    createdAt: string;
  };
}

export type UpcomingBillingCycle = Pick<
  SubscriptionBillingCycle,
  'billingAttemptExpectedDate' | 'skipped' | 'cycleIndex'
>;

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

export enum SellingPlanInterval {
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Year = 'YEAR',
}

export interface Settings {
  id: string;
  retryAttempts: number;
  daysBetweenRetryAttempts: number;
  onFailure: OnFailureTypeType;
  inventoryRetryAttempts?: number | undefined;
  inventoryDaysBetweenRetryAttempts?: number | undefined;
  inventoryOnFailure?: OnFailureTypeType | undefined;
  inventoryNotificationFrequency?:
    | InventoryNotificationFrequencyTypeType
    | undefined;
}

export interface SettingsMetaobject {
  id: string;
  retryAttempts: {value: number};
  daysBetweenRetryAttempts: {value: number};
  onFailure: {value: OnFailureTypeType};
  inventoryDaysBetweenRetryAttempts: {value: number | undefined};
  inventoryRetryAttempts: {value: number | undefined};
  inventoryOnFailure: {value: OnInventoryFailureTypeType | undefined};
  inventoryNotificationFrequency: {
    value: InventoryNotificationFrequencyTypeType | undefined;
  };
}

export enum SellingPlanPricingPolicy {
  FixedAmount = 'FIXED_AMOUNT',
  Percentage = 'PERCENTAGE',
  Price = 'PRICE',
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

export const SubscriptionPlansActions = {
  Delete: 'DELETE',
} as const;

declare global {
  interface Window {
    ENV: {
      NODE_ENV: NodeEnv;
    };
  }
}

export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface ShopInfo {
  id: string;
  name: string;
  ianaTimezone: string;
  email: string;
  contactEmail: string;
  currencyCode: CurrencyCode;
  myshopifyDomain: string;
  primaryDomain: {
    url: string;
  };
}
