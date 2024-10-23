import {mockShopify} from '#/setup-app-bridge';
import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import userEvent from '@testing-library/user-event';
import {action} from '../../../../../../app.contracts.bulk-operation';
import SubscriptionContractPause from '~/graphql/SubscriptionContractPauseMutation';
import SubscriptionContractResume from '~/graphql/SubscriptionContractResumeMutation';
import SubscriptionContractCancel from '~/graphql/SubscriptionContractCancelMutation';
import {BulkActionModal, type BulkActionModalProps} from '../BulkActionModal';
import {performBulkMutation} from '~/utils/bulkOperations';

const {graphQL} = mockShopifyServer();

vi.mock('~/utils/bulkOperations', () => ({
  performBulkMutation: vi.fn().mockResolvedValue({
    bulkOperation: {
      id: 'bulk-operation-id-1',
      status: 'CREATED',
      type: 'MUTATION',
    },
  }),
}));

const pollBulkOperationMock = vi.hoisted(() => vi.fn());

vi.mock('~/utils/bulkOperations/use-bulk-operation-polller', () => ({
  useBulkOperationPoller: vi.fn().mockReturnValue({
    pollBulkOperation: pollBulkOperationMock,
  }),
}));

const pauseProps = {
  selectedResources: ['1'],
  open: true,
  action: 'bulk-pause',
  translationKey: 'table.pauseBulkActionModal',
  closeModal: vi.fn(),
};

const activateProps = {
  selectedResources: ['1'],
  open: true,
  action: 'bulk-activate',
  translationKey: 'table.activateBulkActionModal',
  closeModal: vi.fn(),
};

const cancelProps = {
  selectedResources: ['1'],
  open: true,
  action: 'bulk-cancel',
  translationKey: 'table.cancelBulkActionModal',
  closeModal: vi.fn(),
};

function mountBulkActionModal({
  modalProps,
}: {
  modalProps: BulkActionModalProps;
}) {
  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/contracts',
        Component: () => <BulkActionModal {...modalProps} />,
      },
      {
        path: '/app/contracts/bulk-operation',
        action,
      },
    ],
    remixStubProps: {
      initialEntries: ['/app/contracts'],
    },
  });
}

describe('PauseBulkActionModal', () => {
  beforeEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
  });

  it('renders modal title for one contract', async () => {
    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await screen.findByText('Set 1 contract as paused?');
  });

  it('renders modal title for multiple contracts', async () => {
    mountBulkActionModal({
      modalProps: {
        ...pauseProps,
        selectedResources: ['1', '2'],
      },
    });

    await screen.findByText('Set 2 contracts as paused?');
  });

  it('renders modal content', async () => {
    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await screen.findByText(
      'Billing and upcoming orders will be paused. Paused contracts can be resumed at any time.',
    );
  });

  it('calls performBulkMutation with selected contract ids and pause mutation', async () => {
    mountBulkActionModal({
      modalProps: {
        ...pauseProps,
        selectedResources: ['1', '34'],
      },
    });

    await userEvent.click(screen.getByText('Set as paused'));

    await waitForGraphQL();

    expect(vi.mocked(performBulkMutation)).toHaveBeenCalledWith(
      graphQL,
      SubscriptionContractPause,
      [{subscriptionContractId: '1'}, {subscriptionContractId: '34'}],
    );
  });

  it('shows a success toast when pausing contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await userEvent.click(screen.getByText('Set as paused'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Pausing subscription contract...',
      {
        isError: false,
      },
    );
  });

  it('closes modal and starts polling when pausing contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await userEvent.click(screen.getByText('Set as paused'));

    await waitForGraphQL();

    expect(pauseProps.closeModal).toHaveBeenCalled();
    expect(pollBulkOperationMock).toHaveBeenCalled();
  });

  it('shows an error toast when pausing contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValueOnce(new Error('Error'));

    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await userEvent.click(screen.getByText('Set as paused'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to pause contract',
      {
        isError: true,
      },
    );
  });

  it('does not close modal or start polling when pausing contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValueOnce(new Error('Error'));

    mountBulkActionModal({
      modalProps: pauseProps,
    });

    await userEvent.click(screen.getByText('Set as paused'));

    await waitForGraphQL();

    expect(pauseProps.closeModal).not.toHaveBeenCalled();
    expect(pollBulkOperationMock).not.toHaveBeenCalled();
  });
});

describe('ActivateBulkActionModal', () => {
  beforeEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
  });

  it('renders modal title for one contract', async () => {
    mountBulkActionModal({
      modalProps: activateProps,
    });

    await screen.findByText('Resume 1 contract?');
  });

  it('renders modal title for multiple contracts', async () => {
    mountBulkActionModal({
      modalProps: {
        ...activateProps,
        selectedResources: ['1', '2'],
      },
    });

    await screen.findByText('Resume 2 contracts?');
  });

  it('renders modal content', async () => {
    mountBulkActionModal({
      modalProps: activateProps,
    });

    await screen.findByText(
      'Billing and upcoming orders will resume. Active contracts will be billed as normal.',
    );
  });

  it('calls performBulkMutation with selected contract ids and resume mutation', async () => {
    mountBulkActionModal({
      modalProps: {
        ...activateProps,
        selectedResources: ['1', '34'],
      },
    });

    await userEvent.click(screen.getByText('Resume contracts'));

    await waitForGraphQL();

    expect(vi.mocked(performBulkMutation)).toHaveBeenCalledWith(
      graphQL,
      SubscriptionContractResume,
      [{subscriptionContractId: '1'}, {subscriptionContractId: '34'}],
    );
  });

  it('shows a success toast when resuming contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: activateProps,
    });

    await userEvent.click(screen.getByText('Resume contract'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Resuming subscription contract...',
      {
        isError: false,
      },
    );
  });

  it('closes modal and starts polling when resuming contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: activateProps,
    });

    await userEvent.click(screen.getByText('Resume contract'));

    await waitForGraphQL();

    expect(activateProps.closeModal).toHaveBeenCalled();
    expect(pollBulkOperationMock).toHaveBeenCalled();
  });

  it('shows an error toast when resuming contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValueOnce(new Error('Error'));

    mountBulkActionModal({
      modalProps: activateProps,
    });

    await userEvent.click(screen.getByText('Resume contract'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to resume contract',
      {
        isError: true,
      },
    );
  });

  it('does not close modal or start polling when resuming contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValueOnce(new Error('Error'));

    mountBulkActionModal({
      modalProps: activateProps,
    });

    await userEvent.click(screen.getByText('Resume contract'));

    await waitForGraphQL();

    expect(activateProps.closeModal).not.toHaveBeenCalled();
    expect(pollBulkOperationMock).not.toHaveBeenCalled();
  });
});

describe('CancelBulkActionModal', () => {
  beforeEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
  });

  it('renders modal title for one contract', async () => {
    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await screen.findByText('Set 1 contract as canceled?');
  });

  it('renders modal title for multiple contracts', async () => {
    mountBulkActionModal({
      modalProps: {
        ...cancelProps,
        selectedResources: ['1', '2'],
      },
    });

    await screen.findByText('Set 2 contracts as canceled?');
  });

  it('renders modal content', async () => {
    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await screen.findByText(
      'Billing and upcoming orders will end immediately. Canceled contracts cannot be resumed.',
    );
  });

  it('calls performBulkMutation with selected contract ids and cancel mutation', async () => {
    mountBulkActionModal({
      modalProps: {
        ...cancelProps,
        selectedResources: ['1', '34'],
      },
    });

    await userEvent.click(screen.getByText('Set as canceled'));

    await waitForGraphQL();

    expect(vi.mocked(performBulkMutation)).toHaveBeenCalledWith(
      graphQL,
      SubscriptionContractCancel,
      [{subscriptionContractId: '1'}, {subscriptionContractId: '34'}],
    );
  });

  it('shows a success toast when canceling contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await userEvent.click(screen.getByText('Set as canceled'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Canceling subscription contract...',
      {
        isError: false,
      },
    );
  });

  it('closes modal and starts polling when canceling contracts is successful', async () => {
    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await userEvent.click(screen.getByText('Set as canceled'));

    await waitForGraphQL();

    expect(cancelProps.closeModal).toHaveBeenCalled();
    expect(pollBulkOperationMock).toHaveBeenCalled();
  });

  it('shows an error toast when canceling contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValue(new Error('Error'));

    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await userEvent.click(screen.getByText('Set as canceled'));

    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to cancel contract',
      {
        isError: true,
      },
    );
  });

  it('does not close modal or start polling when canceling contracts fails', async () => {
    vi.mocked(performBulkMutation).mockRejectedValue(new Error('Error'));

    mountBulkActionModal({
      modalProps: cancelProps,
    });

    await userEvent.click(screen.getByText('Set as canceled'));

    await waitForGraphQL();

    expect(cancelProps.closeModal).not.toHaveBeenCalled();
    expect(pollBulkOperationMock).not.toHaveBeenCalled();
  });
});
