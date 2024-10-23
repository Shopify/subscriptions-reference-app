import {useApi} from '@shopify/ui-extensions-react/customer-account';

export enum BuyerSubscriptionsExtensionTarget {
  FullPage = 'customer-account.page.render',
  OrderActionMenuItem = 'customer-account.order.action.menu-item.render',
}

export function useExtensionApi<
  T extends
    BuyerSubscriptionsExtensionTarget = BuyerSubscriptionsExtensionTarget.FullPage,
>() {
  const extensionApi = useApi<T>();
  return extensionApi;
}
