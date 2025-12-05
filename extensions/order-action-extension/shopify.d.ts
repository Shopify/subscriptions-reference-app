import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/OrderActionMenuItem.tsx' {
  const shopify: import('@shopify/ui-extensions/customer-account.order.action.menu-item.render').Api;
  const globalThis: {shopify: typeof shopify};
}
