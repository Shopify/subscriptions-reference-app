import {useApi} from '@shopify/ui-extensions-react/admin';

interface UseExtensionApiArgs {
  extensionTarget: PurchaseOptionExtensionTarget;
}

const PurchaseOptionExtensionTarget = {
  product: 'admin.product-purchase-option.action.render',
  variant: 'admin.product-variant-purchase-option.action.render',
} as const;

export type PurchaseOptionExtensionTarget =
  (typeof PurchaseOptionExtensionTarget)[keyof typeof PurchaseOptionExtensionTarget];

export function useExtensionApi({extensionTarget}: UseExtensionApiArgs) {
  const api = useApi<'admin.product-details.action.render'>(
    extensionTarget as any,
  );
  return api;
}
