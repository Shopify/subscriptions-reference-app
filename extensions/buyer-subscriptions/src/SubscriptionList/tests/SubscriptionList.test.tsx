import {mountWithAppContext} from 'tests/utilities';
import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mockUseToast} from 'tests/mocks/toast';

import {beforeEach, describe, expect, it} from 'vitest';

import {screen, waitFor} from '@testing-library/react';

import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

import {SubscriptionList} from '../SubscriptionList';
import type {SubscriptionListQuery as SubscriptionListQueryData} from 'generatedTypes/customer.generated';
import {
  generateMockSubscriptionContracts,
  generateSubscriptionContractEdges,
} from './Fixtures';
import {
  subscriptionListPauseContract,
  subscriptionListResumeContract,
  subscriptionListSkipNextOrder,
} from '../components/SubscriptionListItem/tests/TestActions';
import {SuccessToastType} from 'utilities/hooks/useToast';
import userEvent from '@testing-library/user-event';

type GraphqlContractEdges =
  SubscriptionListQueryData['customer']['subscriptionContracts']['edges'];

const {mockCustomerApiGraphQL, mockExtensionApi} = mockApis();
const {mockShowSuccessToast} = mockUseToast();

describe('SubscriptionList', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
  });

  it('renders without error', async () => {
    mockSubscriptions({contractCount: 1});
    await mountWithAppContext(<SubscriptionList />);

    await waitFor(async () => {
      expect(await screen.findByText('Subscriptions')).toBeInTheDocument();
    });
  });

  it('renders loading state when loading', async () => {
    mockCustomerApiGraphQL({
      data: undefined,
      loading: true,
    });
    await mountWithAppContext(<SubscriptionList />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('renders an empty state when there are no subscriptions', async () => {
    mockSubscriptions({contractCount: 0});
    await mountWithAppContext(<SubscriptionList />);

    expect(
      await screen.findByText('No subscriptions purchased'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Go to store to shop for subscriptions'),
    ).toBeInTheDocument();
  });

  it('does not render an empty state when there are subscriptions', async () => {
    mockSubscriptions({contractCount: 1});
    await mountWithAppContext(<SubscriptionList />);

    expect(
      screen.queryByText('No subscriptions purchased'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Go to store to shop for subscriptions'),
    ).not.toBeInTheDocument();
  });

  it('renders one SubscriptionListItem for each subscription contract', async () => {
    const contractCount = 5;
    mockSubscriptions({contractCount});
    await mountWithAppContext(<SubscriptionList />);

    expect(screen.getAllByText('Active')).toHaveLength(contractCount);
    expect(screen.getAllByText('View details')).toHaveLength(contractCount);
  });

  it('displays the total item quantity for each contract', async () => {
    mockSubscriptions({contractCount: 1});
    await mountWithAppContext(<SubscriptionList />);

    expect(screen.getByText('6 items')).toBeInTheDocument();
  });

  describe('Success toasts', () => {
    it('shows a success toast when a subscription is paused', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            ...generateMockSubscriptionContracts({
              contractCount: 1,
            }),
          },
          subscriptionContractPause: {
            contract: {
              status: 'PAUSED',
            },
          },
        },
        loading: false,
      });

      await mountWithAppContext(<SubscriptionList />);

      mockCustomerApiGraphQL({
        data: {
          subscriptionContractPause: {
            contract: {
              status: 'PAUSED',
            },
          },
        },
        loading: false,
      });

      await subscriptionListPauseContract();

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Paused);
    });

    it('shows a success toast when a subscription is resumed', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            ...generateMockSubscriptionContracts({
              contractCount: 1,
              contractStatus: 'PAUSED',
            }),
          },
          subscriptionContractActivate: {
            contract: {
              status: 'ACTIVE',
            },
          },
        },
        loading: false,
      });

      await mountWithAppContext(<SubscriptionList />);

      await subscriptionListResumeContract();

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Resumed);
    });

    it('shows a success toast when the next order is skipped', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            ...generateMockSubscriptionContracts({
              contractCount: 1,
              contractStatus: 'ACTIVE',
            }),
          },
          subscriptionBillingCycleSkip: {
            billingCycle: {
              skipped: true,
            },
          },
        },
        loading: false,
      });

      await mountWithAppContext(<SubscriptionList />);

      await subscriptionListSkipNextOrder();

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Skipped);
    });

    describe('<ResumeSubscriptionModal />', () => {
      it('renders with resumeDate from first unskipped billing cycle', async () => {
        mockSubscriptions({
          contractCount: 1,
          contractStatus: 'PAUSED' as SubscriptionContractSubscriptionStatus,
        });
        await mountWithAppContext(<SubscriptionList />);

        await userEvent.click(screen.getByRole('button', {name: 'Resume'}));

        expect(
          screen.getByText(
            /If you resume this subscription, billing will resume on May 26, 2023\./,
          ),
        ).toBeInTheDocument();
      });
    });
  });
});

function mockSubscriptions({
  contractCount = 1,
  contractStatus = 'ACTIVE' as SubscriptionContractSubscriptionStatus,
  lastOrderTotal,
  subscriptionContractEdges,
}: {
  contractCount: number;
  contractStatus?: SubscriptionContractSubscriptionStatus;
  lastOrderTotal?: string;
  priceBreakdownTotal?: string;
  subscriptionContractEdges?: GraphqlContractEdges;
}) {
  mockCustomerApiGraphQL({
    data: {
      customer: {
        subscriptionContracts: {
          edges:
            subscriptionContractEdges ??
            generateSubscriptionContractEdges(
              contractCount,
              contractStatus,
              lastOrderTotal,
            ),
        },
      },
    },
  });
}
