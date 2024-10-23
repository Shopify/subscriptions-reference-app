import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen, waitFor} from '@testing-library/react';

import type {SkipNextOrderModalProps} from '../SkipNextOrderModal';
import {
  SKIP_NEXT_ORDER_MODAL_ID,
  SkipNextOrderModal,
} from '../SkipNextOrderModal';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';
import userEvent from '@testing-library/user-event';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

const defaultProps: SkipNextOrderModalProps = {
  contractId: '1',
  cycleIndexToSkip: 2,
  resumeDate: '2021-01-01',
  onSkipOrder: vi.fn(),
};

describe('<SkipNextOrderModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders with a skip and close button', async () => {
    await mountWithAppContext(<SkipNextOrderModal {...defaultProps} />);

    expect(screen.getByTitle('Skip next order')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Skip'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Close'})).toBeInTheDocument();
  });

  it('calls ui.overlay.close after clicking close button', async () => {
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<SkipNextOrderModal {...defaultProps} />);

    await clickCloseButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(SKIP_NEXT_ORDER_MODAL_ID);
  });

  it('calls onSkipOrder and ui.overlay.close after successfully pausing a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onSkipOrderSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    mockSkipBillingCycleMutation({success: true});

    await mountWithAppContext(
      <SkipNextOrderModal {...defaultProps} onSkipOrder={onSkipOrderSpy} />,
    );

    await clickSkipButton();

    expect(overlayCloseSpy).toHaveBeenCalled();
    expect(onSkipOrderSpy).toHaveBeenCalled();
  });

  it('does not call onSkipOrder or ui.overlay.close after failing to pause a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onSkipOrderSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    mockSkipBillingCycleMutation({success: false});

    await mountWithAppContext(
      <SkipNextOrderModal {...defaultProps} onSkipOrder={onSkipOrderSpy} />,
    );

    await clickSkipButton();

    expect(onSkipOrderSpy).not.toHaveBeenCalled();
    expect(overlayCloseSpy).not.toHaveBeenCalled();
  });

  it('does not render an error banner by default', async () => {
    mockSkipBillingCycleMutation({success: true});

    await mountWithAppContext(<SkipNextOrderModal {...defaultProps} />);

    expect(
      screen.queryByTitle('Unable to skip next order'),
    ).not.toBeInTheDocument();
  });

  it('renders an error banner when there is an error', async () => {
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    mockSkipBillingCycleMutation({success: false});
    await mountWithAppContext(<SkipNextOrderModal {...defaultProps} />);

    await clickSkipButton();

    await waitFor(() => {
      expect(
        screen.getByTitle('Unable to skip next order'),
      ).toBeInTheDocument();
    });
  });
});

async function clickSkipButton() {
  const skipButton = screen.getByRole('button', {name: 'Skip'});
  await userEvent.click(skipButton);
}

function mockSkipBillingCycleMutation({success = true}: {success: boolean}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionBillingCycleSkip: {
        __typename: 'SubscriptionBillingCycleSkipPayload',
        billingCycle: {
          __typename: 'SubscriptionBillingCycle',
          cycleIndex: 2,
          skipped: success,
        },
        userErrors: success
          ? []
          : [
              {
                __typename: 'SubscriptionBillingCycleSkipUserError',
                message:
                  'There were so many errors when skipping the next order',
              },
            ],
      },
    },
  });
}
