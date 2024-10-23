import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SubscriptionBillingCyclesQuery from '~/graphql/SubscriptionBillingCyclesQuery';
import type {SubscriptionContractStatusType} from '~/types';
import {action as billingCycleSkipAction} from '../../../../app.contracts.$id.billing-cycle-skip/route';
import ContractsDetailsPage, {loader} from '../../../route';
import {
  createMockBillingCycles,
  createMockSubscriptionContract,
} from '../../../tests/Fixtures';
import {mockShopify} from '#/setup-app-bridge';

const defaultContract = createMockSubscriptionContract();
const defaultBillingCycles = (numCycles = 6, hasMore = true) =>
  createMockBillingCycles({
    first: numCycles,
    startDate: defaultContract.nextBillingDate.toISOString(),
    hasMore,
  });

const skippedBillingCycles = createMockBillingCycles({
  startDate: defaultContract.nextBillingDate.toISOString(),
  allSkipped: true,
});

const defaultGraphQLResponses = (
  {skip, numBillingCycles, hasMore, status} = {
    skip: false,
    numBillingCycles: 6,
    hasMore: true,
    status: 'ACTIVE',
  },
) => ({
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: createMockSubscriptionContract({
        subscriptionContract: {
          status: status as any,
        },
      }),
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: skip
        ? skippedBillingCycles
        : defaultBillingCycles(numBillingCycles, hasMore),
    },
  },
  SubscriptionBillingCycleScheduleEdit: {
    data: {
      subscriptionBillingCycleScheduleEdit: {
        billingCycle: {
          skipped: true,
        },
        userErrors: null,
      },
    },
  },
});

const errorGraphQLResponses = (
  {skip, numBillingCycles} = {skip: false, numBillingCycles: 6},
) => ({
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: defaultContract,
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: skip
        ? skippedBillingCycles
        : defaultBillingCycles(numBillingCycles),
    },
  },
  SubscriptionBillingCycleScheduleEdit: {
    data: {
      subscriptionBillingCycleScheduleEdit: {
        billingCycle: {
          skipped: false,
        },
        userErrors: [
          {
            field: 'contractId',
            message: 'Cannot skip billing cycle',
          },
        ],
      },
    },
  },
});

const {graphQL, mockGraphQL} = mockShopifyServer();

async function mountContractDetails({
  skip = false,
  numBillingCycles = 6,
  hasMore = true,
  error = false,
  status = 'ACTIVE',
}: {
  skip?: boolean;
  numBillingCycles?: number;
  hasMore?: boolean;
  error?: boolean;
  status?: SubscriptionContractStatusType;
} = {}) {
  if (error) {
    mockGraphQL(errorGraphQLResponses({skip, numBillingCycles}));
  } else {
    mockGraphQL(
      defaultGraphQLResponses({skip, numBillingCycles, hasMore, status}),
    );
  }

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <ContractsDetailsPage />,
        loader,
      },

      {
        path: `/app/contracts/:id/billing-cycle-skip`,
        action: billingCycleSkipAction,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/${parseGid(defaultContract.id)}`],
    },
  });

  return await screen.findByText('Subscription details');
}

describe('UpcomingBillingCyclesCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Upcoming orders card', async () => {
    await mountContractDetails();

    expect(screen.getByText('Upcoming orders')).toBeInTheDocument();
  });

  it('does not render the Upcoming orders card on cancelled contracts', async () => {
    await mountContractDetails({status: 'CANCELLED'});

    expect(screen.queryByText('Upcoming orders')).not.toBeInTheDocument();
  });

  it('does not fetch upcoming billing cycles on cancelled contracts', async () => {
    await mountContractDetails({status: 'CANCELLED'});

    expect(graphQL).not.toHavePerformedGraphQLOperation(
      SubscriptionBillingCyclesQuery,
    );
  });

  it('displays the show more button', async () => {
    await mountContractDetails();
    expect(screen.getByRole('link', {name: 'Show more'})).toBeInTheDocument();
  });

  it('hides the show more button when there are no more cycles to fetch', async () => {
    await mountContractDetails({
      skip: true,
      numBillingCycles: 6,
      hasMore: false,
      error: false,
    });
    expect(
      screen.queryByRole('link', {name: 'Show more'}),
    ).not.toBeInTheDocument();
  });

  it('displays skip buttons for all billing cycles', async () => {
    await mountContractDetails();
    expect(screen.getAllByRole('button', {name: 'Skip'})).toHaveLength(
      defaultBillingCycles().edges.length,
    );
  });

  it('does not display skip buttons for paused contracts', async () => {
    await mountContractDetails({status: 'PAUSED'});

    expect(
      screen.queryByRole('button', {name: 'Skip'}),
    ).not.toBeInTheDocument();
  });

  it('displays resume buttons for all billing cycles which were skipped', async () => {
    await mountContractDetails({
      skip: true,
      numBillingCycles: 6,
      hasMore: true,
      error: false,
    });
    expect(screen.getAllByRole('button', {name: 'Resume'})).toHaveLength(6);
  });

  it('does not display resume buttons on paused contracts', async () => {
    await mountContractDetails({
      skip: true,
      numBillingCycles: 6,
      hasMore: true,
      error: false,
      status: 'PAUSED',
    });
    expect(
      screen.queryByRole('button', {name: 'Resume'}),
    ).not.toBeInTheDocument();
  });

  it('shows the correct number of billing cycles', async () => {
    await mountContractDetails({
      skip: false,
      numBillingCycles: 12,
      hasMore: true,
      error: false,
    });
    expect(screen.getAllByRole('button', {name: 'Skip'})).toHaveLength(12);
  });

  describe('skip and resume actions', () => {
    it('skips an order and shows a success toast', async () => {
      await mountContractDetails({
        skip: false,
        numBillingCycles: 6,
        hasMore: true,
        error: false,
      });

      const skipButton = screen.getAllByRole('button', {name: 'Skip'})[0];
      await userEvent.click(skipButton);
      await waitForGraphQL();

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Order skipped successfully',
        {isError: false},
      );
    });

    it('resumes an order and shows a success toast', async () => {
      await mountContractDetails({
        skip: true,
        numBillingCycles: 6,
        hasMore: true,
        error: false,
      });

      const skipButton = screen.getAllByRole('button', {name: 'Resume'})[0];
      await userEvent.click(skipButton);
      await waitForGraphQL();

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Order resumed successfully',
        {isError: false},
      );
    });

    it('displays an error toast when a billing cycle fails to skip successfully', async () => {
      await mountContractDetails({
        skip: false,
        numBillingCycles: 6,
        hasMore: true,
        error: true,
      });
      const skipButton = screen.getAllByRole('button', {name: 'Skip'})[0];
      await userEvent.click(skipButton);
      await waitForGraphQL();

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Unable to skip / resume order',
        {isError: true},
      );
    });
  });
});
