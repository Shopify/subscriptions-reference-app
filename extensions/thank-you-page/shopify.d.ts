import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/ThankYouPageManageSubscriptions.tsx' {
  const shopify: import('@shopify/ui-extensions/purchase.thank-you.block.render').Api;
  const globalThis: {shopify: typeof shopify};
}
