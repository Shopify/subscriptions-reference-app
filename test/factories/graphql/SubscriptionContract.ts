import {Factory} from 'fishery';
export const contract = Factory.define<any>(({sequence}) => {
  return {
    id: `gid://shopify/SubscriptionContract/${sequence}`,
    billingPolicy: {
      interval: 'WEEK',
      intervalCount: 1,
      minCycles: 1,
      maxCycles: 2,
      anchors: {
        type: 'WEEKDAY',
        day: 1,
        month: 1,
      },
    },
    customer: {
      id: `gid://shopify/Customer/${sequence}`,
      email: `user-${sequence}@example.com`,
    },
    lastPaymentStatus: 'SUCCEEDED',
    nextBillingDate: '2023-11-30',
    status: 'ACTIVE',
    currencyCode: 'CAD',
    customAttributes: {},
    deliveryPrice: '',
    discounts: [],
  };
});
