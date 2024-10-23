import {faker} from '@faker-js/faker';
import type {
  SubscriptionContractSubscriptionStatus,
  CurrencyCode,
  SubscriptionInterval,
  CountPrecision,
} from 'generatedTypes/customer.types';
import type {SubscriptionListQuery as SubscriptionListQueryData} from 'generatedTypes/customer.generated';

type GraphqlContractEdges =
  SubscriptionListQueryData['customer']['subscriptionContracts']['edges'];

export function generateMockSubscriptionContracts({
  contractCount = 1,
  contractStatus = 'ACTIVE' as SubscriptionContractSubscriptionStatus,
  lastOrderTotal,
  priceBreakdownTotal,
  subscriptionContractEdges,
}: {
  contractCount: number;
  contractStatus?: SubscriptionContractSubscriptionStatus | string;
  lastOrderTotal?: string;
  priceBreakdownTotal?: string;
  subscriptionContractEdges?: GraphqlContractEdges;
}) {
  return {
    subscriptionContracts: {
      edges:
        subscriptionContractEdges ??
        generateSubscriptionContractEdges(
          contractCount,
          contractStatus as SubscriptionContractSubscriptionStatus,
          lastOrderTotal,
          priceBreakdownTotal,
        ),
    },
  };
}

export function generateSubscriptionContractEdges(
  count: number,
  contractStatus: SubscriptionContractSubscriptionStatus,
  lastOrderTotal?: string,
  priceBreakdownTotal?: string,
): GraphqlContractEdges {
  return Array(count)
    .fill('')
    .map(() => ({
      __typename: 'SubscriptionContractEdge',
      node: {
        __typename: 'SubscriptionContract',
        id: faker.string.uuid(),
        currencyCode: 'CAD' as CurrencyCode,
        deliveryPrice: {
          __typename: 'MoneyV2',
          amount: '10',
          currencyCode: 'CAD' as CurrencyCode,
        },
        status: contractStatus,
        upcomingBillingCycles: {
          __typename: 'SubscriptionBillingCycleConnection',
          edges: [
            {
              __typename: 'SubscriptionBillingCycleEdge',
              node: {
                __typename: 'SubscriptionBillingCycle',
                billingAttemptExpectedDate: '2023-05-26T14:00:00Z',
                skipped: false,
                cycleIndex: 1,
              },
            },
            {
              __typename: 'SubscriptionBillingCycleEdge',
              node: {
                __typename: 'SubscriptionBillingCycle',
                billingAttemptExpectedDate: '2023-06-26T14:00:00Z',
                skipped: false,
                cycleIndex: 2,
              },
            },
          ],
        },
        deliveryPolicy: {
          __typename: 'SubscriptionDeliveryPolicy',
          interval: 'MONTH' as SubscriptionInterval,
          intervalCount: {
            __typename: 'Count',
            count: 1,
            precision: 'EXACT' as CountPrecision,
          },
        },
        updatedAt: '2022-09-07T15:50:00Z',
        orders: {
          __typename: 'OrderConnection',
          edges: [
            {
              __typename: 'OrderEdge',
              node: {
                __typename: 'Order',
                id: faker.string.uuid(),
                totalPrice: {
                  __typename: 'MoneyV2',
                  amount: lastOrderTotal || '100',
                  currencyCode: 'CAD' as CurrencyCode,
                },
              },
            },
          ],
        },
        lines: {
          __typename: 'SubscriptionLineConnection',
          edges: [
            {
              __typename: 'SubscriptionLineEdge',
              node: {
                __typename: 'SubscriptionLine',
                name: `${faker.commerce.productName()} - ${faker.commerce.productAdjective()}}`,
                title: faker.commerce.productName(),
                variantTitle: faker.commerce.productAdjective(),
                quantity: 2,
                lineDiscountedPrice: {
                  __typename: 'MoneyV2',
                  amount: '5',
                  currencyCode: 'CAD' as CurrencyCode,
                },
                image: {
                  __typename: 'Image',
                  id: 'gid://shopify/ImageSource/1',
                  altText: null,
                  url: 'shopify.com',
                },
              },
            },
            {
              __typename: 'SubscriptionLineEdge',
              node: {
                __typename: 'SubscriptionLine',
                name: `${faker.commerce.productName()} - ${faker.commerce.productAdjective()}}`,
                title: faker.commerce.productName(),
                variantTitle: faker.commerce.productAdjective(),
                quantity: 4,
                lineDiscountedPrice: {
                  __typename: 'MoneyV2',
                  amount: '20',
                  currencyCode: 'CAD' as CurrencyCode,
                },
                image: {
                  __typename: 'Image',
                  id: 'gid://shopify/ImageSource/1',
                  altText: null,
                  url: 'shopify.com',
                },
              },
            },
          ],
        },
      },
    }));
}
