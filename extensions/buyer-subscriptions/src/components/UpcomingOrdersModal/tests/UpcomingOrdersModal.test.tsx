import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';

import {mountWithAppContext} from 'tests/utilities';
import {screen, waitFor} from '@testing-library/react';

import type {UpcomingOrdersModalProps} from '../UpcomingOrdersModal';
import {
  UpcomingOrdersModal,
  UPCOMING_ORDERS_MODAL_ID,
} from '../UpcomingOrdersModal';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';
import userEvent from '@testing-library/user-event';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

const defaultProps: UpcomingOrdersModalProps = {
  contractId: '1',
  upcomingBillingCycles: [
    {
      cycleIndex: 0,
      skipped: false,
      billingAttemptExpectedDate: '2021-01-01',
    },
    {
      cycleIndex: 1,
      skipped: false,
      billingAttemptExpectedDate: '2021-02-01',
    },
  ],
  refetchSubscriptionContract: vi.fn(),
  refetchLoading: false,
};

const startsWithSkip = (name: string) => name.startsWith('Skip');
const startsWithUnskip = (name: string) => name.startsWith('Unskip');

describe('<UpcomingOrdersModal />', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
  });

  it('renders order date and skip button for each billing cycle', async () => {
    await mountWithAppContext(
      <UpcomingOrdersModal
        {...defaultProps}
        upcomingBillingCycles={[
          {
            cycleIndex: 0,
            skipped: false,
            billingAttemptExpectedDate: '2021-01-01T12:00:00',
          },
          {
            cycleIndex: 1,
            skipped: false,
            billingAttemptExpectedDate: '2021-02-01T12:00:00',
          },
          {
            cycleIndex: 2,
            skipped: false,
            billingAttemptExpectedDate: '2021-03-01T12:00:00',
          },
          {
            cycleIndex: 3,
            skipped: false,
            billingAttemptExpectedDate: '2021-04-01T12:00:00',
          },
        ]}
      />,
    );

    expect(screen.getByText('Jan 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('Feb 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('Mar 1, 2021')).toBeInTheDocument();

    expect(screen.getAllByRole('button', {name: startsWithSkip})).toHaveLength(
      3,
    );
  });

  it('renders Skip button for unskipped orders, and Unskip button for skipped orders', async () => {
    await mountWithAppContext(
      <UpcomingOrdersModal
        {...defaultProps}
        upcomingBillingCycles={[
          {
            cycleIndex: 0,
            skipped: false,
            billingAttemptExpectedDate: '2021-01-01',
          },
          {
            cycleIndex: 1,
            skipped: true,
            billingAttemptExpectedDate: '2021-02-01',
          },
          {
            cycleIndex: 2,
            skipped: false,
            billingAttemptExpectedDate: '2021-03-01',
          },
          {
            cycleIndex: 3,
            skipped: false,
            billingAttemptExpectedDate: '2021-04-01',
          },
        ]}
      />,
    );

    expect(screen.getAllByRole('button', {name: startsWithSkip})).toHaveLength(
      2,
    );
    expect(
      screen.getByRole('button', {name: startsWithUnskip}),
    ).toBeInTheDocument();
  });

  it('clicking close button closes the modal', async () => {
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<UpcomingOrdersModal {...defaultProps} />);

    await clickCloseButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(UPCOMING_ORDERS_MODAL_ID);
  });

  describe('skip order', () => {
    it('renders toast and calls refetch subscription contract after calling SkipOrder mutation', async () => {
      const showToastSpy = vi.fn();
      mockExtensionApi({mocks: {showToast: showToastSpy}});

      mockSkipOrderMutation({
        billingAttemptExpectedDate: '2021-02-01T12:00:00',
      });

      const refetchSpy = vi.fn();

      await mountWithAppContext(
        <UpcomingOrdersModal
          {...defaultProps}
          contractId="5"
          refetchSubscriptionContract={refetchSpy}
          upcomingBillingCycles={[
            {
              cycleIndex: 0,
              skipped: false,
              billingAttemptExpectedDate: '2021-01-01T12:00:00',
            },
            {
              cycleIndex: 1,
              skipped: false,
              billingAttemptExpectedDate: '2021-02-01T12:00:00',
            },
            {
              cycleIndex: 2,
              skipped: false,
              billingAttemptExpectedDate: '2021-03-01T12:00:00',
            },
          ]}
        />,
      );

      await userEvent.click(
        screen.getAllByRole('button', {name: startsWithSkip})[1],
      );

      expect(showToastSpy).toHaveBeenCalledWith('Order on Feb 1, 2021 skipped');

      expect(refetchSpy).toHaveBeenCalled();
    });

    it('renders error banner and does not call refetch after error in SkipOrder mutation', async () => {
      mockSkipOrderMutation({
        billingAttemptExpectedDate: '2021-02-01',
        skipped: false,
      });

      const refetchSpy = vi.fn();

      await mountWithAppContext(
        <UpcomingOrdersModal
          {...defaultProps}
          contractId="5"
          refetchSubscriptionContract={refetchSpy}
          upcomingBillingCycles={[
            {
              cycleIndex: 0,
              skipped: false,
              billingAttemptExpectedDate: '2021-01-01',
            },
            {
              cycleIndex: 2,
              skipped: false,
              billingAttemptExpectedDate: '2021-03-01',
            },
          ]}
        />,
      );

      await userEvent.click(
        screen.getAllByRole('button', {name: startsWithSkip})[0],
      );

      await waitFor(() => {
        expect(screen.getByText('Error skipping order')).toBeInTheDocument();
      });

      expect(refetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('unskip order', () => {
    it('renders success banner and calls refetch after calling UnskipOrder mutation', async () => {
      const showToastSpy = vi.fn();
      mockExtensionApi({mocks: {showToast: showToastSpy}});

      mockUnskipOrderMutation({
        billingAttemptExpectedDate: '2021-02-01T12:00:00',
      });

      const refetchSpy = vi.fn();

      await mountWithAppContext(
        <UpcomingOrdersModal
          {...defaultProps}
          contractId="5"
          refetchSubscriptionContract={refetchSpy}
          upcomingBillingCycles={[
            {
              cycleIndex: 0,
              skipped: false,
              billingAttemptExpectedDate: '2021-01-01T12:00:00',
            },
            {
              cycleIndex: 1,
              skipped: true,
              billingAttemptExpectedDate: '2021-02-01T12:00:00',
            },
            {
              cycleIndex: 2,
              skipped: false,
              billingAttemptExpectedDate: '2021-03-01T12:00:00',
            },
          ]}
        />,
      );

      await userEvent.click(
        screen.getByRole('button', {name: startsWithUnskip}),
      );
      expect(showToastSpy).toHaveBeenCalledWith(
        'Order on Feb 1, 2021 unskipped',
      );

      expect(refetchSpy).toHaveBeenCalled();
    });

    it('renders error banner and does not call refetch after error in UnSkipOrder mutation', async () => {
      mockUnskipOrderMutation({
        billingAttemptExpectedDate: '2021-02-01',
        skipped: true,
      });

      const refetchSpy = vi.fn();

      await mountWithAppContext(
        <UpcomingOrdersModal
          {...defaultProps}
          contractId="5"
          refetchSubscriptionContract={refetchSpy}
          upcomingBillingCycles={[
            {
              cycleIndex: 0,
              skipped: true,
              billingAttemptExpectedDate: '2021-01-01',
            },
            {
              cycleIndex: 2,
              skipped: false,
              billingAttemptExpectedDate: '2021-03-01',
            },
          ]}
        />,
      );

      await userEvent.click(
        screen.getByRole('button', {name: startsWithUnskip}),
      );

      await waitFor(() => {
        expect(screen.getByText('Error unskipping order')).toBeInTheDocument();
      });

      expect(refetchSpy).not.toHaveBeenCalled();
    });
  });
});

function mockSkipOrderMutation({
  billingAttemptExpectedDate,
  skipped = true,
}: {
  billingAttemptExpectedDate: string;
  skipped?: boolean;
}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionBillingCycleSkip: {
        billingCycle: {
          cycleIndex: 2,
          skipped,
          billingAttemptExpectedDate,
        },
        userErrors: [],
      },
    },
  });
}

function mockUnskipOrderMutation({
  billingAttemptExpectedDate,
  skipped = false,
}: {
  billingAttemptExpectedDate: string;
  skipped?: boolean;
}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionBillingCycleUnskip: {
        __typename: 'SubscriptionBillingCycleUnskipPayload',
        billingCycle: {
          __typename: 'SubscriptionBillingCycle',
          cycleIndex: 2,
          skipped,
          billingAttemptExpectedDate,
        },
        userErrors: [],
      },
    },
  });
}
