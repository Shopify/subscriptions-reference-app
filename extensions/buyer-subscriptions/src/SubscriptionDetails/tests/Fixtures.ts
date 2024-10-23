import type {SubscriptionContractQuery as SubscriptionContractQueryData} from 'generatedTypes/customer.generated';
import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

export type graphqlSubscriptionContract = NonNullable<
  SubscriptionContractQueryData['customer']['subscriptionContract']
>;

export function createMockSubscriptionContractDetails({
  orders,
  lines,
  status,
  deliveryMethod,
}: {
  orders?: graphqlSubscriptionContract['orders'];
  lines?: graphqlSubscriptionContract['lines'];
  status?: SubscriptionContractSubscriptionStatus;
  deliveryMethod?: graphqlSubscriptionContract['deliveryMethod'];
  lastOrderTotal?: string;
}) {
  return {
    id: 'gid://shopify/SubscriptionContract/1',
    status: status ? status : 'ACTIVE',
    upcomingBillingCycles: {
      edges: [
        {
          node: {
            billingAttemptExpectedDate: '2023-05-26T14:00:00Z',
            skipped: false,
            cycleIndex: 1,
          },
        },
        {
          node: {
            billingAttemptExpectedDate: '2023-06-26T14:00:00Z',
            skipped: false,
            cycleIndex: 2,
          },
        },
      ],
    },
    deliveryPolicy: {
      interval: 'MONTH',
      intervalCount: {
        count: 1,
        precision: 'EXACT',
      },
    },
    currencyCode: 'CAD',
    deliveryPrice: {
      amount: '10',
      currencyCode: 'CAD',
    },
    deliveryMethod: deliveryMethod || {
      address: {
        address1: '123 Fake St',
        address2: 'Apt 2',
        city: 'Ottawa',
        provinceCode: 'ON',
        countryCode: 'CA',
        zip: 'K4P1L3',
      },
      shippingOption: {
        presentmentTitle: 'Standard Shipping',
      },
    },
    lines: lines || {
      edges: [
        {
          node: {
            id: 'gid://shopify/SubscriptionLine/1',
            name: 'Fresh shoes - Size 10',
            title: 'Fresh Shoes',
            variantTitle: 'Size 10',
            quantity: 1,
            currentPrice: {
              amount: '100',
              currencyCode: 'CAD',
            },
            lineDiscountedPrice: {
              amount: '100',
              currencyCode: 'CAD',
            },
            image: {
              id: 'gid://shopify/ImageSource/1',
              altText: null,
              url: 'shopify.com',
            },
          },
        },
      ],
    },
    orders: orders || {
      edges: [
        {
          node: {
            id: 'gid://shopify/Order/1',
            createdAt: '2022-09-07T15:50:00Z',
            totalPrice: {
              amount: '100',
              currencyCode: 'CAD',
            },
          },
        },
      ],
    },
  };
}
