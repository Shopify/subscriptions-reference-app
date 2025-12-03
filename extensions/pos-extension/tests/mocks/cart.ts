import {Cart, LineItem} from '@shopify/ui-extensions/point-of-sale';

export const mockLineItem: LineItem = {
  uuid: '1',
  quantity: 1,
  price: 10,
  isGiftCard: false,
  taxable: true,
  taxLines: [],
  discounts: [],
  properties: {},
  title: 'Local Product Title',
  variantId: 1,
};

export const mockLineItemWithSellingPlan: LineItem = {
  ...mockLineItem,
  uuid: '2',
  variantId: 2,
  hasSellingPlanGroups: true,
  requiresSellingPlan: false,
  sellingPlan: {
    id: 1,
    name: 'Test Selling Plan',
    deliveryInterval: 'Every 2 weeks',
    deliveryIntervalCount: 2,
    digest: 'test-digest',
  },
};

export const mockLineItemWithRequiredSellingPlan = {
  ...mockLineItemWithSellingPlan,
  requiresSellingPlan: true,
};

export const mockCartWithNoSellingPlanItems: Cart = {
  lineItems: [mockLineItem],
  subtotal: '10',
  taxTotal: '1',
  grandTotal: '11',
  cartDiscounts: [],
  properties: {},
};

export const mockCartWithOneSellingPlanItem: Cart = {
  lineItems: [mockLineItemWithSellingPlan],
  subtotal: '10',
  taxTotal: '1',
  grandTotal: '11',
  cartDiscounts: [],
  properties: {},
};

export const mockCartWithTwoSellingPlanItems: Cart = {
  lineItems: [mockLineItemWithSellingPlan, mockLineItemWithRequiredSellingPlan],
  subtotal: '20',
  taxTotal: '2',
  grandTotal: '22',
  cartDiscounts: [],
  properties: {},
};
