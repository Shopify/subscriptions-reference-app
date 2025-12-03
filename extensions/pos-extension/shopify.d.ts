import '@shopify/ui-extensions';

declare module './src/MenuItemModal.tsx' {
  const shopify: import('@shopify/ui-extensions/pos.cart.line-item-details.action.render').Api;
  const globalThis: {shopify: typeof shopify};
}

declare module './src/MenuItem.tsx' {
  const shopify: import('@shopify/ui-extensions/pos.cart.line-item-details.action.menu-item.render').Api;
  const globalThis: {shopify: typeof shopify};
}

declare module './src/Tile.tsx' {
  const shopify: import('@shopify/ui-extensions/pos.home.tile.render').Api;
  const globalThis: {shopify: typeof shopify};
}

declare module './src/TileModal.tsx' {
  const shopify: import('@shopify/ui-extensions/pos.home.modal.render').Api;
  const globalThis: {shopify: typeof shopify};
}
