import {TEST_SHOP} from '#/constants';
import {mockShopifyServer} from '#/test-utils';
import {afterEach, beforeAll, describe, expect, it} from 'vitest';
import prisma from '~/db.server';
import SubscriptionContractWithBillingCycleQuery from '~/graphql/SubscriptionContractWithBillingCycleQuery';
import {createMockSubscriptionContractEditDetails} from '~/routes/app.contracts.$id.edit/components/EditSubscriptionDetailsCard/tests/Fixtures';
import {SubscriptionContractStatus} from '~/types/contracts';
import {
  findSubscriptionContractWithBillingCycle,
  getContractCustomerId,
  getContractDetails,
  getContractEditDetails,
  getContracts,
} from '../SubscriptionContract.server';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('findSubscriptionContractWithBillingCycle', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
    graphQL.mockRestore();
  });

  it('returns a contract and billing cycle', async () => {
    mockGraphQL({
      SubscriptionContractWithBillingCycle: {
        data: {
          subscriptionContract: {
            id: 'gid://shopify/SubscriptionContract/1',
            status: 'ACTIVE',
          },
          subscriptionBillingCycle: {
            cycleIndex: 1,
            status: 'UNBILLED',
            billingAttempts: {
              edges: [],
            },
          },
        },
      },
    });

    const {subscriptionContract, subscriptionBillingCycle} =
      await findSubscriptionContractWithBillingCycle({
        shop: TEST_SHOP,
        contractId: 'gid://shopify/SubscriptionContract/1',
        date: '2023-11-13T17:23:33Z',
      });

    expect(subscriptionContract.id).toEqual(
      'gid://shopify/SubscriptionContract/1',
    );
    expect(subscriptionBillingCycle.cycleIndex).toEqual(1);

    expect(graphQL).toHavePerformedGraphQLOperation(
      SubscriptionContractWithBillingCycleQuery,
      {
        variables: {
          contractId: 'gid://shopify/SubscriptionContract/1',
          date: '2023-11-13T17:23:33Z',
        },
      },
    );
  });

  it('throws if it does not exist', async () => {
    mockGraphQL({
      SubscriptionContractWithBillingCycle: {
        data: {
          subscriptionContract: null,
          subscriptionBillingCycle: null,
        },
      },
    });

    expect(
      findSubscriptionContractWithBillingCycle({
        shop: TEST_SHOP,
        contractId: 'gid://shopify/SubscriptionContract/2',
        date: '2023-11-13T17:23:33Z',
      }),
    ).rejects.toThrowError(
      'Failed to find SubscriptionContract with id: gid://shopify/SubscriptionContract/2',
    );
  });
});

describe('getContracts', () => {
  it('returns a list of contracts', async () => {
    const id = 'gid://shopify/SubscriptionContract/1';
    const status = 'ACTIVE';
    const currencyCode = 'CAD';
    const customer = {displayName: 'Jon Snow'};
    const deliveryPolicy = {
      interval: SubscriptionContractStatus.Active,
      intervalCount: 1,
    };
    const lines = {
      edges: [
        {
          node: {
            id: 'gid://shopify/SubscriptionContractLine/1',
            productId: 'gid://shopify/Product/1',
            lineDiscountedPrice: {
              amount: 12,
              currencyCode: 'CAD',
            },
          },
        },
      ],
    };
    const lineCount = 0;
    const pageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: '',
      endCursor: '',
    };

    mockGraphQL({
      SubscriptionContracts: {
        data: {
          subscriptionContracts: {
            edges: [
              {
                node: {
                  id,
                  currencyCode,
                  status,
                  customer,
                  deliveryPolicy,
                  lines,
                  lineCount,
                },
              },
            ],
            pageInfo,
          },
          contractsWithInventoryError: {
            edges: [],
          },
        },
      },
    });

    const response = await getContracts(graphQL, {
      first: 1,
    });
    expect(response).toEqual({
      hasContractsWithInventoryError: false,
      subscriptionContractPageInfo: pageInfo,
      subscriptionContracts: [
        {
          customer,
          id,
          deliveryPolicy,
          totalPrice: {
            amount: 12,
            currencyCode: 'CAD',
          },
          billingAttempts: [],
          status,
          lines: [
            {
              id: 'gid://shopify/SubscriptionContractLine/1',
              productId: 'gid://shopify/Product/1',
              lineDiscountedPrice: {
                amount: 12,
                currencyCode: 'CAD',
              },
            },
          ],
          lineCount,
        },
      ],
    });
  });
});

describe('getContractsWithInventoryError', () => {
  it('returns a list of contracts with inventory error', async () => {
    const id = 'gid://shopify/SubscriptionContract/1';
    const status = 'ACTIVE';
    const currencyCode = 'CAD';
    const customer = {displayName: 'Jon Snow'};
    const deliveryPolicy = {
      interval: SubscriptionContractStatus.Active,
      intervalCount: 1,
    };
    const lines = {
      edges: [
        {
          node: {
            id: 'gid://shopify/SubscriptionContractLine/1',
            productId: 'gid://shopify/Product/1',
            lineDiscountedPrice: {
              amount: 12,
              currencyCode: 'CAD',
            },
          },
        },
      ],
    };
    const billingAttempts = {
      edges: [
        {
          node: {
            id: 'gid://shopify/BillingAttempt/1',
            errorCode: 'INSUFFICIENT_INVENTORY',
          },
        },
      ],
    };
    const lineCount = 0;
    const pageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: '',
      endCursor: '',
    };

    mockGraphQL({
      SubscriptionContracts: {
        data: {
          subscriptionContracts: {
            edges: [
              {
                node: {
                  id,
                  currencyCode,
                  status,
                  customer,
                  deliveryPolicy,
                  lines,
                  lineCount,
                  billingAttempts,
                },
              },
            ],
            pageInfo,
          },
          contractsWithInventoryError: {
            edges: [
              {
                node: {
                  id,
                },
              },
            ],
          },
        },
      },
    });

    const response = await getContracts(graphQL, {
      first: 1,
    });
    expect(response).toEqual({
      hasContractsWithInventoryError: true,
      subscriptionContractPageInfo: pageInfo,
      subscriptionContracts: [
        {
          customer,
          id,
          deliveryPolicy,
          totalPrice: {
            amount: 12,
            currencyCode: 'CAD',
          },
          status,
          lines: [
            {
              id: 'gid://shopify/SubscriptionContractLine/1',
              productId: 'gid://shopify/Product/1',
              lineDiscountedPrice: {
                amount: 12,
                currencyCode: 'CAD',
              },
            },
          ],
          lineCount,
          billingAttempts: [
            {
              id: 'gid://shopify/BillingAttempt/1',
              errorCode: 'INSUFFICIENT_INVENTORY',
            },
          ],
        },
      ],
    });
  });
});

describe('getContractCustomerId', () => {
  it('returns a customer id', async () => {
    mockGraphQL({
      SubscriptionContractCustomerQuery: {
        data: {
          subscriptionContract: {
            id: 'gid://shopify/SubscriptionContract/1',
            customer: {
              id: 'gid://shopify/Customer/1',
            },
          },
        },
      },
    });

    const customerId = await getContractCustomerId(
      TEST_SHOP,
      'gid://shopify/SubscriptionContract/1',
    );

    expect(customerId).toEqual('gid://shopify/Customer/1');
  });
});

describe('getContractDetails', () => {
  it('returns a contract and its details', async () => {
    const contractId = 'gid://shopify/SubscriptionContract/1';
    const {graphQL, mockGraphQL} = mockShopifyServer();

    const mockResponse = {
      data: {
        subscriptionContract: {
          id: contractId,
          status: 'ACTIVE',
          lines: {
            edges: [],
          },
          billingAttempts: {
            edges: [],
          },
          currencyCode: 'USD',
          discounts: {
            edges: [],
          },
          deliveryPrice: {
            amount: '0.00',
            currencyCode: 'USD',
          },
          priceBreakdownEstimate: {
            subtotalPrice: {
              amount: 0,
              currencyCode: 'USD',
            },
            totalShippingPrice: {
              amount: '0.00',
              currencyCode: 'USD',
            },
          },
        },
      },
    };
    mockGraphQL({SubscriptionContractDetails: mockResponse});

    const result = await getContractDetails(graphQL, contractId);

    expect(result).toEqual({
      ...mockResponse.data.subscriptionContract,
      lines: [],
      billingAttempts: [],
    });
  });
});

describe('getContractEditDetails', () => {
  it('returns a contract with the details required for the edit page', async () => {
    const contractId = 'gid://shopify/SubscriptionContract/1';
    const {graphQL, mockGraphQL} = mockShopifyServer();
    const mockEditDetails = createMockSubscriptionContractEditDetails();
    const mockContractResponse = {
      data: {
        subscriptionContract: {
          ...mockEditDetails,
          id: contractId,
        },
      },
    };
    const mockVariantPriceResponse = {
      data: {
        productVariant: {
          id: 'gid://shopify/ProductVariant/1',
          price: 120,
        },
      },
    };
    mockGraphQL({
      SubscriptionContractEditDetails: mockContractResponse,
      ProductVariantPrice: mockVariantPriceResponse,
    });
    const result = await getContractEditDetails(graphQL, contractId);

    expect(result).toEqual({
      ...mockContractResponse.data.subscriptionContract,
      lines: [
        {
          ...mockEditDetails.lines.edges[0].node,
          currentOneTimePurchasePrice:
            mockVariantPriceResponse.data.productVariant.price,
        },
      ],
      priceBreakdownEstimate: {
        subtotalPrice: mockEditDetails.lines.edges[0].node.lineDiscountedPrice,
        totalShippingPrice: mockEditDetails.deliveryPrice,
      },
    });
  });
});
