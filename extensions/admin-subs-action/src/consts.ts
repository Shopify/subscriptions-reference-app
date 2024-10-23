export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  AMOUNT: 'FIXED_AMOUNT',
  PRICE: 'PRICE',
  NONE: 'NONE',
} as const;

export type DiscountTypeType = (typeof DiscountType)[keyof typeof DiscountType];

export const DeliveryInterval = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;

export type DeliveryIntervalType =
  (typeof DeliveryInterval)[keyof typeof DeliveryInterval];

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
export const EXTENSION_TARGET_PRODUCT =
  'admin.product-purchase-option.action.render' as any;

export const EXTENSION_TARGET_PRODUCT_VARIANT =
  'admin.product-variant-purchase-option.action.render' as any;
