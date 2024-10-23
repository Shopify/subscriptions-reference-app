import {Factory} from 'fishery';

export const billingAttempt = Factory.define<any>(({sequence}) => {
  return {
    id: `gid://shopify/SubscriptionBillingAttempt/${sequence}`,
    errorMessage: 'Card expired',
    errorCode: 'CARD_EXPIRED',
    originTime: '2023-11-12T12:00:00Z',
    ready: true,
    subscriptionContract: {
      id: `gid://shopify/SubscriptionContract/${sequence}`,
    },
  };
});
