import {
  Cart,
  LineItem,
  ProductVariant,
} from '@shopify/ui-extensions/point-of-sale';

export const getSubscriptionItems = (cart: Cart) => {
  return cart.lineItems.filter((lineItem) => lineItem.hasSellingPlanGroups);
};

export const getProductNameFromVariant = (
  fetchedVariant: ProductVariant | undefined,
  cartLineItem: LineItem | undefined,
): string => {
  if (fetchedVariant?.product?.title && fetchedVariant.product.title.trim()) {
    return fetchedVariant.product.title;
  }

  if (fetchedVariant?.title && fetchedVariant.title.trim()) {
    return fetchedVariant.title;
  }

  return cartLineItem?.title ?? '';
};

export const getVariantName = (
  variant: ProductVariant | undefined,
): string | undefined => {
  return variant?.title === 'Default Title' ? undefined : variant?.title;
};

export const getVariantImage = (
  variant: ProductVariant | undefined,
): string | undefined => {
  return variant?.image ?? variant?.product?.featuredImage ?? undefined;
};
