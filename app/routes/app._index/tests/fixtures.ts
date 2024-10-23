import {composeGid} from '@shopify/admin-graphql-api-utilities';
import type {SubscriptionContractsQuery as SubscriptionContractsQueryType} from 'types/admin.generated';
import type {CurrencyCode, SellingPlanInterval} from 'types/admin.types';

type SubscriptionContractsQueryContract =
  SubscriptionContractsQueryType['subscriptionContracts']['edges'][0]['node'];

export function createMockSubscriptionContractsQuery({
  contractEdges,
  pageInfo,
}: {
  contractEdges?: SubscriptionContractsQueryType['subscriptionContracts']['edges'];
  pageInfo?: SubscriptionContractsQueryType['subscriptionContracts']['pageInfo'];
} = {}): SubscriptionContractsQueryType {
  return {
    subscriptionContracts: {
      edges: contractEdges || [
        {
          node: createMockSubscriptionContractsQueryContract(),
        },
      ],
      pageInfo: pageInfo || {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
    contractsWithInventoryError: {
      edges: [],
    },
  };
}

export function createMockSubscriptionContractsQueryContract(
  contract: Partial<SubscriptionContractsQueryContract> = {},
): SubscriptionContractsQueryContract {
  return {
    id: composeGid('SubscriptionContract', 1),
    customer: {
      id: composeGid('Customer', 1),
      displayName: 'John Doe',
    },
    currencyCode: 'USD' as CurrencyCode,
    status: 'ACTIVE' as SubscriptionContractsQueryContract['status'],
    deliveryPolicy: {
      interval: 'MONTH' as SellingPlanInterval,
      intervalCount: 1,
    },
    billingAttempts: {
      edges: [
        {
          node: {
            id: '578839',
            errorCode: null,
          },
        },
      ],
    },
    linesCount: {
      count: 1,
    },
    lines: {
      edges: [
        {
          node: {
            id: composeGid('SubscriptionContractLine', 1),
            productId: composeGid('Product', 1),
            title: 'Mexican Coffee',
            lineDiscountedPrice: {
              amount: 20,
              currencyCode: 'USD' as CurrencyCode,
            },
          },
        },
      ],
    },
    ...contract,
  };
}

export const mockContracts = [
  {
    id: '111111111',
    customer: {
      displayName: 'John Doe',
    },
    product: 'Mexican Coffee',
    price: '$20.00',
    deliveryPolicy: {
      interval: 'WEEK',
      intervalCount: 1,
    },
    deliveryFrequency: 'Every 2 weeks',
    status: 'Active',
  },
  {
    id: '222222222',
    customer: {
      displayName: 'John Doe',
    },
    product: 'Mexican Coffee',
    price: '$40.00',
    deliveryPolicy: {
      interval: 'MONTH',
      intervalCount: 1,
    },
    deliveryFrequency: 'Every 2 weeks',
    status: 'Paused',
  },
  {
    id: '3333333333',
    customer: {
      displayName: 'John Doe',
    },
    product: 'Mexican Coffee',
    price: '$10.00',
    deliveryPolicy: {
      interval: 'YEAR',
      intervalCount: 1,
    },
    deliveryFrequency: 'Every 2 weeks',
    status: 'Cancelled',
  },
];
