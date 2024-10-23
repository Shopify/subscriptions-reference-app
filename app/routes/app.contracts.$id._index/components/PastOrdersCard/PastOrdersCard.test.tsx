import {mockShopifyServer, mountRemixStubWithAppContext} from '#/test-utils';
import {composeGid, parseGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {SubscriptionBillingCycleBillingCycleStatus} from 'types/admin.types';
import SubscriptionPastBillingCyclesQuery from '~/graphql/SubscriptionPastBillingCyclesQuery';
import ContractsDetailsPage, {loader} from '../../route';
import {
  createMockBillingCycles,
  createMockPastBillingCyclesResponse,
  createMockSubscriptionContract,
} from '../../tests/Fixtures';

const {mockGraphQL, graphQL} = mockShopifyServer();

const defaultContract = createMockSubscriptionContract({
  subscriptionContract: {id: composeGid('SubscriptionContract', 1)},
});

const defaultGraphQLResponses = {
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: defaultContract,
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: createMockBillingCycles(),
    },
  },
  SubscriptionPastBillingCycles: {
    data: createMockPastBillingCyclesResponse(),
  },
  SubscriptionBillingCycleByIndex: {
    data: {
      subscriptionBillingCycle: {
        cycleStartAt: new Date('2019-01-01').toISOString(),
        cycleEndAt: new Date('2019-01-31').toISOString(),
        billingAttemptExpectedDate: new Date('2019-01-31').toISOString(),
      },
    },
  },
};

async function mountContractDetailsRoute({
  graphQLResponses = defaultGraphQLResponses as object,
} = {}) {
  mockGraphQL(graphQLResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <ContractsDetailsPage />,
        loader,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/${parseGid(defaultContract.id)}`],
    },
  });

  return await screen.findByText('Subscription details');
}

describe('PastOrdersCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date']});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the date for each past order and a button to view them', async () => {
    const pastOrderDates = [
      new Date('2021-01-01T12:00:00.101Z'),
      new Date('2021-02-01T12:00:00.101Z'),
      new Date('2021-03-01T12:00:00.101Z'),
    ];

    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
        SubscriptionPastBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: Array.from({length: pastOrderDates.length}).map(
                (_, index) => ({
                  node: {
                    billingAttemptExpectedDate:
                      pastOrderDates[index].toISOString(),
                    cycleIndex: index + 1,
                    skipped: false,
                    status:
                      'BILLED' as SubscriptionBillingCycleBillingCycleStatus,
                    billingAttempts: {
                      edges: [
                        {
                          node: {
                            id: composeGid(
                              'SubscriptionBillingAttempt',
                              index + 1,
                            ),
                            order: {
                              id: composeGid('Order', index + 1),
                              createdAt: pastOrderDates[index],
                            },
                          },
                        },
                      ],
                    },
                  },
                }),
              ),
            },
          },
        },
      },
    });

    expect(screen.getByText('January 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('February 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('March 1, 2021')).toBeInTheDocument();

    const orderLinks = screen.queryAllByRole('link', {name: 'View'});
    expect(orderLinks).toHaveLength(3);

    expect(orderLinks[0]).toHaveAttribute('href', 'shopify://admin/orders/1');
    expect(orderLinks[1]).toHaveAttribute('href', 'shopify://admin/orders/2');
    expect(orderLinks[2]).toHaveAttribute('href', 'shopify://admin/orders/3');
  });

  it('shows the date that the order was created at if it is different from the expected billing date', async () => {
    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
        SubscriptionPastBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: [
                {
                  node: {
                    billingAttemptExpectedDate: '2021-01-05T12:00:00Z',
                    cycleIndex: 1,
                    skipped: false,
                    status:
                      'BILLED' as SubscriptionBillingCycleBillingCycleStatus,
                    billingAttempts: {
                      edges: [
                        {
                          node: {
                            id: composeGid('SubscriptionBillingAttempt', 1),
                            order: {
                              id: composeGid('Order', 1),
                              createdAt: '2021-01-03T12:00:00Z',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    expect(screen.getByText('January 3, 2021')).toBeInTheDocument();
    const orderLinks = screen.queryAllByRole('link', {name: 'View'});
    expect(orderLinks[0]).toHaveAttribute('href', 'shopify://admin/orders/1');
  });

  it('should mark skipped billing cycles as skipped and display the expected billing date', async () => {
    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
        SubscriptionPastBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: [
                {
                  node: {
                    billingAttemptExpectedDate: '2021-01-01T12:00:00Z',
                    cycleIndex: 1,
                    skipped: true,
                    status:
                      'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus,
                    billingAttempts: {
                      edges: [],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    expect(screen.getByText('January 1, 2021')).toBeInTheDocument();
    expect(screen.queryByText('View')).not.toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });

  it('does not display unbilled and unskipped orders', async () => {
    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
        SubscriptionPastBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: [
                {
                  node: {
                    billingAttemptExpectedDate: '2021-01-01',
                    cycleIndex: 1,
                    skipped: false,
                    status:
                      'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus,
                    billingAttempts: {
                      edges: [],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    expect(screen.queryByText('View')).not.toBeInTheDocument();
    expect(screen.queryByText('Skipped')).not.toBeInTheDocument();
    expect(screen.queryByText('January 1, 2021')).not.toBeInTheDocument();
  });

  it('only fetches billing cycles in the past', async () => {
    const mockDate = new Date(2024, 1, 1, 12);
    vi.setSystemTime(mockDate);

    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
      },
    });

    expect(graphQL).toHavePerformedGraphQLOperation(
      SubscriptionPastBillingCyclesQuery,
      {
        variables: {
          contractId: 'gid://shopify/SubscriptionContract/1',
          endDate: mockDate.toISOString(),
          numberOfAttempts: 10,
          numberOfCycles: 5,
          startDate:
            defaultGraphQLResponses.SubscriptionBillingCycleByIndex.data
              .subscriptionBillingCycle.cycleStartAt,
        },
      },
    );
  });

  it('shows order not created message for billing cycles with no order', async () => {
    const pastOrderDates = [
      new Date('2021-01-01T12:00:00.101Z'),
      new Date('2021-02-01T12:00:00.101Z'),
      new Date('2021-03-01T12:00:00.101Z'),
    ];

    await mountContractDetailsRoute({
      graphQLResponses: {
        ...defaultGraphQLResponses,
        SubscriptionPastBillingCycles: {
          data: {
            subscriptionBillingCycles: {
              edges: Array.from({length: pastOrderDates.length}).map(
                (_, index) => ({
                  node: {
                    billingAttemptExpectedDate:
                      pastOrderDates[index].toISOString(),
                    cycleIndex: index + 1,
                    skipped: false,
                    status:
                      'BILLED' as SubscriptionBillingCycleBillingCycleStatus,
                    billingAttempts: {
                      edges: [
                        {
                          node: {
                            id: composeGid(
                              'SubscriptionBillingAttempt',
                              index + 1,
                            ),
                            order: null,
                          },
                        },
                      ],
                    },
                  },
                }),
              ),
            },
          },
        },
      },
    });

    expect(screen.getByText('Past orders')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('February 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('March 1, 2021')).toBeInTheDocument();

    const foundOrderNotCreated = screen.getAllByText('Order not created');
    expect(foundOrderNotCreated).toHaveLength(3);
  });
});
