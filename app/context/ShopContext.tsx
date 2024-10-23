import React from 'react';

export interface ShopContextValue {
  shopId: number;
  name: string;
  shopifyDomain: string;
  ianaTimezone: string;
  currencyCode: string;
  contactEmail: string;
  email: string;
}

const ShopContext = React.createContext<ShopContextValue | null>(null);

export function useShopInfo(): ShopContextValue {
  const context = React.useContext(ShopContext);

  if (!context) {
    throw new Error('useShopInfo must be used within a ShopContextProvider');
  }

  return context;
}

export default ShopContext;
