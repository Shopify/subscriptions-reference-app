import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it} from 'vitest';
import DeleteSellingPlanGroupMutation from '~/graphql/DeleteSellingPlanGroupMutation';
import PlansIndex, {action, loader} from '../../../route';
import {mockedSellingPlanGroupsResponse} from '../../../tests/Fixtures';

import {mockShopify} from '#/setup-app-bridge';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('SellingPlanGroupsDeleteModal - Show toast', () => {
  beforeEach(() => {
    graphQL.mockRestore();
  });

  it('displays a success toast when deletion succeeds for a single plan', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
      DeleteSellingPlanGroup: {},
    });

    await openDeleteModal({skipGraphQLMock: true});
    const modal = screen.getByRole('dialog');

    await userEvent.click(within(modal).getByText('Delete plan'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Subscription plan deleted',
      {isError: false},
    );
  });

  it('displays a success toast when deletion succeeds for multiple plans', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
      DeleteSellingPlanGroup: {},
    });

    await openDeleteModal({skipGraphQLMock: true, selectMultiplePlans: true});
    const modal = screen.getByRole('dialog');

    await userEvent.click(within(modal).getByText('Delete plans'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Subscription plans deleted',
      {isError: false},
    );
  });

  it('displays an error toast when deletion fails for a single plan', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
    });

    await openDeleteModal({skipGraphQLMock: true, selectMultiplePlans: false});
    const modal = screen.getByRole('dialog');

    await userEvent.click(within(modal).getByText('Delete plan'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Failed to delete subscription plan',
      {isError: true},
    );
  });

  it('displays an error toast when deletion fails for multiple plans', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
    });

    await openDeleteModal({skipGraphQLMock: true, selectMultiplePlans: true});
    const modal = screen.getByRole('dialog');

    await userEvent.click(within(modal).getByText('Delete plans'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Failed to delete subscription plans',
      {isError: true},
    );
  });
});

describe('SellingPlanGroupsDeleteModal - Actions', () => {
  it('calls the DeleteSellingPlanGroup mutation when the delete button is clicked', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
      DeleteSellingPlanGroup: {},
    });

    await openDeleteModal({skipGraphQLMock: true});
    const modal = screen.getByRole('dialog');
    await userEvent.click(within(modal).getByText('Delete plan'));
    await waitForGraphQL();

    expect(graphQL).toHavePerformedGraphQLOperation(
      DeleteSellingPlanGroupMutation,
      {
        variables: {
          id: 'gid://shopify/SellingPlanGroup/6',
        },
      },
    );
  });

  it('closes the modal when the cancel button is clicked', async () => {
    await openDeleteModal();
    await userEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes the modal when the X icon button is clicked', async () => {
    await openDeleteModal();
    await userEvent.click(screen.getByRole('button', {name: 'Close overlay'}));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens the modal when at least one selling plan group is selected and the Delete plan(s) button is clicked', async () => {
    await openDeleteModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

const openDeleteModal = async ({
  selectMultiplePlans = false,
  skipGraphQLMock = false,
}: {
  selectMultiplePlans?: boolean;
  skipGraphQLMock?: boolean;
} = {}) => {
  await mountSellingPlansList({skipGraphQLMock});
  const checkboxes = screen.getAllByRole('checkbox');

  if (selectMultiplePlans) {
    checkboxes
      .filter((c) => c.id.startsWith('Select-'))
      .forEach(async (checkbox) => {
        await userEvent.click(checkbox);
      });
  } else {
    const checkbox = checkboxes.find(
      (c) => c.id === 'Select-gid://shopify/SellingPlanGroup/6',
    );
    if (checkbox) {
      await userEvent.click(checkbox);
    }
  }

  const buttonText = selectMultiplePlans ? 'Delete plans' : 'Delete plan';

  // Polaris index table has multiple buttons with the same bulk action text
  // Find the first one to open the modal
  const buttons = await screen.findAllByText(buttonText);
  const firstButton = buttons[0];

  await userEvent.click(firstButton);
};

async function mountSellingPlansList({
  skipGraphQLMock = false,
  searchParams = '',
} = {}) {
  if (!skipGraphQLMock) {
    mockGraphQL(mockedSellingPlanGroupsResponse);
  }

  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/plans',
        Component: () => <PlansIndex />,
        loader,
        action,
      },
      {
        path: '/app/plans/create',
        Component: () => <div>Create subscription plan</div>,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/plans?${searchParams || ''}`],
    },
  });

  return await screen.findByText('Subscription plans');
}
