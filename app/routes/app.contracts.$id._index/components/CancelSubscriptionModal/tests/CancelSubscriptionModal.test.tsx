import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {action as cancelAction} from '../../../../app.contracts.$id.cancel/route';
import ContractsDetailsPage, {loader} from '../../../route';
import {
  createMockBillingCycles,
  createMockSubscriptionContract,
} from '../../../tests/Fixtures';
import {mockShopify} from '#/setup-app-bridge';

const NUM_BILLING_CYCLES = 6;

const defaultContract = createMockSubscriptionContract();
const defaultBillingCycles = () =>
  createMockBillingCycles({
    first: NUM_BILLING_CYCLES,
    startDate: defaultContract.nextBillingDate.toISOString(),
  });

const defaultGraphQLResponses = () => ({
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: defaultContract,
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: defaultBillingCycles(),
    },
  },
  SubscriptionContractCancel: {
    data: {
      subscriptionContractCancel: {
        contract: {
          id: defaultContract.id,
        },
        userErrors: [],
      },
    },
  },
});

const errorGraphQLResponses = () => ({
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: defaultContract,
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: defaultBillingCycles(),
    },
  },
  SubscriptionContractCancel: {
    data: {
      subscriptionContractCancel: {
        contract: {
          id: defaultContract.id,
        },
        userErrors: [
          {
            field: 'contractId',
            message: 'Cannot cancel contract',
          },
        ],
      },
    },
  },
});

const {mockGraphQL} = mockShopifyServer();

async function mountContractDetails({error} = {error: false}) {
  if (error) {
    mockGraphQL(errorGraphQLResponses());
  } else {
    mockGraphQL(defaultGraphQLResponses());
  }

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <ContractsDetailsPage />,
        loader,
      },
      {
        path: `/app/contracts/:id/cancel`,
        action: cancelAction,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/${parseGid(defaultContract.id)}`],
    },
  });

  return await screen.findByText('Subscription details');
}

describe('CancelSubscriptionModal', () => {
  it('renders the modal on Cancel click', async () => {
    await mountContractDetails();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // There will be two cancel buttons on screen
    // the first one should be the page action
    // the second one should be the one in the modal
    const cancelButtons = screen.getAllByRole('button', {
      name: 'Cancel subscription',
    });
    const cancelPageAction = cancelButtons[0];
    await userEvent.click(cancelPageAction);

    const modal = screen.getByRole('dialog');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(modal).toHaveTextContent('Cancel subscription');
  });

  describe('when primary modal button clicked', () => {
    it('calls SubscriptionContractCancel successfully', async () => {
      await mountContractDetails();

      // index 0 = bulk action menu button
      // index 1 = button inside modal
      await userEvent.click(
        screen.getAllByRole('button', {
          name: 'Cancel subscription',
        })[0],
      );

      // re-query for the button since the markup changes after the modal is opened
      await userEvent.click(
        screen.getAllByRole('button', {
          name: 'Cancel subscription',
        })[1],
      );
      await waitForGraphQL();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Contract canceled successfully',
        {isError: false},
      );
    });
  });

  it('calls SubscriptionContractCancel unsuccessfully', async () => {
    await mountContractDetails({
      error: true,
    });

    await userEvent.click(
      screen.getAllByRole('button', {
        name: 'Cancel subscription',
      })[0],
    );

    await userEvent.click(
      screen.getAllByRole('button', {
        name: 'Cancel subscription',
      })[1],
    );
    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to cancel contract',
      {isError: true},
    );
  });
});
