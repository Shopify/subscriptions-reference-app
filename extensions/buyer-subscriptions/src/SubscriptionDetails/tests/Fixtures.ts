import {faker} from '@faker-js/faker';
import type {
  SubscriptionContractQuery as SubscriptionContractQueryData,
  PaymentMethodsQuery as PaymentMethodsQueryData,
} from 'generatedTypes/customer.generated';
import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

export type graphqlSubscriptionContract = NonNullable<
  SubscriptionContractQueryData['customer']['subscriptionContract']
>;

export function createMockSubscriptionContractDetails({
  orders,
  status,
  paymentInstrument,
  deliveryMethod,
  priceBreakdownEstimate,
}: {
  orders?: graphqlSubscriptionContract['orders'];
  status?: SubscriptionContractSubscriptionStatus;
  paymentInstrument?: graphqlSubscriptionContract['paymentInstrument'];
  deliveryMethod?: graphqlSubscriptionContract['deliveryMethod'];
  priceBreakdownEstimate?: graphqlSubscriptionContract['priceBreakdownEstimate'];
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
    paymentInstrument: paymentInstrument || {
      id: 'gid://shopify/CustomerCreditCard/1',
      brand: 'visa',
      lastDigits: '4242',
      expiryMonth: Number(faker.date.month()),
      expiryYear: Number(faker.date.future().getFullYear() + 1),
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
    priceBreakdownEstimate,
    lines: {
      edges: [
        {
          node: {
            id: 'gid://shopify/SubscriptionLine/1',
            name: 'Fresh shoes - Size 10',
            title: 'Fresh Shoes',
            variantTitle: 'Size 10',
            quantity: 1,
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

export function createMockCustomerWithPaymentMethods({
  edges,
  paypalEmail,
}: {
  edges?: PaymentMethodsQueryData['customer']['creditCards']['edges'];
  paypalEmail?: string;
}) {
  return {
    customer: {
      __typename: 'Customer',
      creditCards: {
        __typename: 'CustomerCreditCardConnection',
        edges: edges || [
          {
            __typename: 'CustomerCreditCardEdge',
            node: {
              __typename: 'CustomerCreditCard',
              id: 'gid://shopify/CustomerCreditCard/1',
              lastDigits: '4242',
              brand: 'visa',
            },
          },
          {
            __typename: 'CustomerCreditCardEdge',
            node: {
              __typename: 'CustomerCreditCard',
              id: 'gid://shopify/CustomerCreditCard/2',
              lastDigits: '4243',
              brand: 'mastercard',
            },
          },
        ],
      },
      paypalBillingAgreement: paypalEmail
        ? {
            __typename: 'PaypalBillingAgreement',
            id: 'gid://shopify/PaypalBillingAgreement/1',
            paypalAccountEmail: paypalEmail,
          }
        : null,
    },
  };
}
