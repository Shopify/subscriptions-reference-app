import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mockApis} from 'tests/mocks/api';
import {mountWithAppContext} from 'tests/utilities';

import {screen} from '@testing-library/react';

import {faker} from '@faker-js/faker';

import type {UpcomingOrderCardProps} from '../UpcomingOrderCard';
import {UpcomingOrderCard} from '../UpcomingOrderCard';
import userEvent from '@testing-library/user-event';

const defaultProps: UpcomingOrderCardProps = {
  contractId: '1',
  upcomingBillingCycles: [
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
  ],
  onSkipOrder: vi.fn(),
  refetchSubscriptionContract: vi.fn(),
  refetchLoading: false,
};

const {mockExtensionApi} = mockApis();

describe('<UpcomingOrderCard />', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
  });

  it('renders', async () => {
    await mountWithAppContext(<UpcomingOrderCard {...defaultProps} />);

    expect(screen.getByText('Upcoming order')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2021')).toBeInTheDocument();
  });

  it('renders skip next order button', async () => {
    await mountWithAppContext(<UpcomingOrderCard {...defaultProps} />);

    expect(
      screen.getByRole('button', {name: (name) => name.startsWith('Skip')}),
    ).toBeInTheDocument();
  });

  it('renders show upcoming orders button', async () => {
    await mountWithAppContext(<UpcomingOrderCard {...defaultProps} />);

    expect(
      screen.getByRole('button', {name: 'Show upcoming orders'}),
    ).toBeInTheDocument();
  });

  it('renders SkipNextOrderModal if the next order can be skipped', async () => {
    await mountWithAppContext(
      <UpcomingOrderCard
        {...defaultProps}
        contractId="88"
        upcomingBillingCycles={[
          {
            cycleIndex: 34,
            skipped: false,
            billingAttemptExpectedDate: '2021-01-01T12:00:00',
          },
          {
            cycleIndex: 35,
            skipped: false,
            billingAttemptExpectedDate: '2021-02-01T12:00:00',
          },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', {name: 'Skip'}));

    expect(
      screen.getByText(
        'Do you want to skip the next order? Your subscription will resume on Feb 1, 2021.',
      ),
    ).toBeInTheDocument();
  });

  it('does not render SkipNextOrderModal if the next order cannot be skipped', async () => {
    await mountWithAppContext(
      <UpcomingOrderCard
        {...defaultProps}
        contractId="88"
        upcomingBillingCycles={[
          {
            cycleIndex: 34,
            skipped: true,
            billingAttemptExpectedDate: '2021-01-01',
          },
          {
            cycleIndex: 35,
            skipped: true,
            billingAttemptExpectedDate: '2021-02-01',
          },
        ]}
      />,
    );

    expect(
      screen.queryByText(/Do you want to skip the next order?/),
    ).not.toBeInTheDocument();
  });

  it('renders UpcomingOrdersModal', async () => {
    const mockBillingCycles = [
      {
        cycleIndex: 34,
        skipped: false,
        billingAttemptExpectedDate: '2021-01-01T12:00:00',
      },
      {
        cycleIndex: 35,
        skipped: false,
        billingAttemptExpectedDate: '2021-02-01T12:00:00',
      },
      {
        cycleIndex: 36,
        skipped: false,
        billingAttemptExpectedDate: '2021-03-01T12:00:00',
      },
      {
        cycleIndex: 37,
        skipped: false,
        billingAttemptExpectedDate: '2021-04-01T12:00:00',
      },
    ];
    await mountWithAppContext(
      <UpcomingOrderCard
        {...defaultProps}
        contractId="88"
        upcomingBillingCycles={mockBillingCycles}
      />,
    );

    const showUpcomingOrdersButton = screen.getByRole('button', {
      name: 'Show upcoming orders',
    });
    expect(showUpcomingOrdersButton).toBeInTheDocument();

    await userEvent.click(showUpcomingOrdersButton);

    expect(screen.getAllByText('Jan 1, 2021')).toHaveLength(2);
    expect(screen.getByText('Feb 1, 2021')).toBeInTheDocument();
    expect(screen.getByText('Mar 1, 2021')).toBeInTheDocument();
  });

  it('renders a warning when the next order cannot be skipped', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2020-12-01'));
    await mountWithAppContext(
      <UpcomingOrderCard
        {...defaultProps}
        contractId="88"
        upcomingBillingCycles={[
          {
            cycleIndex: 1,
            skipped: true,
            billingAttemptExpectedDate: '2021-01-01',
          },
          {
            cycleIndex: 2,
            skipped: true,
            billingAttemptExpectedDate: '2021-02-01',
          },
          {
            cycleIndex: 3,
            skipped: true,
            billingAttemptExpectedDate: '2021-03-01',
          },
          {
            cycleIndex: 4,
            skipped: true,
            billingAttemptExpectedDate: '2021-04-01',
          },
          {
            cycleIndex: 5,
            skipped: true,
            billingAttemptExpectedDate: '2021-05-01',
          },
          {
            cycleIndex: 6,
            skipped: false,
            billingAttemptExpectedDate: '2021-06-01',
          },
        ]}
      />,
    );

    expect(
      screen.getByText('The maximum number of orders have been skipped'),
    ).toBeInTheDocument();
  });

  it('renders a warning when the next order cannot be skipped due to being more than a year away', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2020-12-01'));

    await mountWithAppContext(
      <UpcomingOrderCard
        {...defaultProps}
        contractId="88"
        upcomingBillingCycles={[
          {
            cycleIndex: 1,
            skipped: false,
            billingAttemptExpectedDate: `${
              faker.date.future().getFullYear() + 1
            }-12-31`,
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        'Unable to skip due to order being more than a year away',
      ),
    ).toBeInTheDocument();
  });
});
