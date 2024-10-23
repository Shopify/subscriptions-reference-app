import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mockUseToast} from 'tests/mocks/toast';
import {screen} from '@testing-library/react';
import {beforeEach} from 'vitest';
import {mountWithAppContext} from 'tests/utilities';
import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

import type {SubscriptionActionsProps} from '../SubscriptionActions';
import {
  SubscriptionActions,
  SUBSCRIPTION_ACTIONS_POPOVER_ID,
} from '../SubscriptionActions';
import {
  subscriptionListPauseContract,
  subscriptionListResumeContract,
  subscriptionListSkipNextOrder,
} from '../../tests/TestActions';

import {SuccessToastType} from 'utilities/hooks/useToast';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();
const {mockShowSuccessToast} = mockUseToast();

const defaultProps: SubscriptionActionsProps = {
  id: '1',
  status: 'ACTIVE',
  resumeDateIfNextCycleSkipped: '2024-01-01',
  cycleIndexToSkip: 1,
  refetchSubscriptionListData: vi.fn(),
};

describe('<SubscriptionActions />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders actions for active subscriptions', async () => {
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      status: 'ACTIVE',
    };

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    expect(screen.getByText('View details')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Skip next order')).toBeInTheDocument();
  });

  it('does not render skip next order action when there is no resume date or cycle index to skip', async () => {
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      status: 'ACTIVE',
      resumeDateIfNextCycleSkipped: undefined,
      cycleIndexToSkip: undefined,
    };

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    expect(screen.getByText('View details')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Skip next order')).not.toBeInTheDocument();
  });

  it('renders actions for paused subscriptions', async () => {
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      status: 'PAUSED',
    };

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    expect(screen.getByText('View details')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('renders actions for cancelled subscriptions', async () => {
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      status: 'CANCELLED',
    };

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    expect(screen.getByText('View details')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('calls refetchSubscriptionContract, showToast, and ui.overlay.close when onPauseSubscription is called', async () => {
    const refetchSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    const toastSpy = vi.fn();

    mockShowSuccessToast(toastSpy);

    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      refetchSubscriptionListData: refetchSpy,
    };

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

    mockExtensionApi({
      mocks: {closeOverlay: overlayCloseSpy},
    });

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    await subscriptionListPauseContract();

    expect(refetchSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(
      SUBSCRIPTION_ACTIONS_POPOVER_ID,
    );
    expect(toastSpy).toHaveBeenCalledWith(SuccessToastType.Paused);
  });

  it('calls refetchSubscriptionContract, showToast and ui.overlay.close when onResumeSubscription is called', async () => {
    const refetchSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
      refetchSubscriptionListData: refetchSpy,
    };
    const showToastSpy = vi.fn();

    mockShowSuccessToast(showToastSpy);

    mockCustomerApiGraphQL({
      data: {
        subscriptionContractActivate: {
          contract: {
            status: 'ACTIVE',
          },
        },
      },
      loading: false,
    });

    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    await subscriptionListResumeContract();

    expect(refetchSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(
      SUBSCRIPTION_ACTIONS_POPOVER_ID,
    );
    expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Resumed);
  });

  it('calls refetchSubscriptionContract, showToast and ui.overlay.close when onSkipOrder is called', async () => {
    const refetchSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    const mockProps: SubscriptionActionsProps = {
      ...defaultProps,
      refetchSubscriptionListData: refetchSpy,
    };
    const showToastSpy = vi.fn();

    mockShowSuccessToast(showToastSpy);

    mockCustomerApiGraphQL({
      data: {
        subscriptionBillingCycleSkip: {
          billingCycle: {
            skipped: true,
          },
        },
      },
      loading: false,
    });

    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<SubscriptionActions {...mockProps} />);

    await subscriptionListSkipNextOrder();

    expect(refetchSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(
      SUBSCRIPTION_ACTIONS_POPOVER_ID,
    );
    expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Skipped);
  });
});
