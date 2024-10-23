import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {screen} from '@testing-library/react';
import {mountWithAppContext} from 'tests/utilities';
import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

import {
  CANCEL_MODAL_ID,
  CancelSubscriptionModal,
} from '../CancelSubscriptionModal';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';
import userEvent from '@testing-library/user-event';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

const defaultProps = {
  contractId: 'gid://shopify/SubscriptionContract/1',
  onCancelSubscription: vi.fn(),
};

describe('<CancelSubscriptionModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders with a cancel and close button', async () => {
    await mountWithAppContext(<CancelSubscriptionModal {...defaultProps} />);

    expect(screen.getByTitle('Cancel subscription')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Cancel subscription'}),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Close'})).toBeInTheDocument();
  });

  it('calls ui.overlay.close after clicking the close button', async () => {
    const overlayCloseSpy = vi.fn();

    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<CancelSubscriptionModal {...defaultProps} />);

    await clickCloseButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(CANCEL_MODAL_ID);
  });

  it('calls onCancelSubscription and ui.overlay.close after successfully cancelling a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onCancelSubscriptionSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockCancelSubscriptionMutation({success: true});

    await mountWithAppContext(
      <CancelSubscriptionModal
        {...defaultProps}
        onCancelSubscription={onCancelSubscriptionSpy}
      />,
    );

    await clickCancelSubscriptionButton();

    expect(onCancelSubscriptionSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(CANCEL_MODAL_ID);
  });

  it('does not call onCancelSubscription or ui.overlay.close after failing to cancel a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onCancelSubscriptionSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockCancelSubscriptionMutation({success: false});

    await mountWithAppContext(
      <CancelSubscriptionModal
        {...defaultProps}
        onCancelSubscription={onCancelSubscriptionSpy}
      />,
    );

    await clickCancelSubscriptionButton();

    expect(onCancelSubscriptionSpy).not.toHaveBeenCalled();
    expect(overlayCloseSpy).not.toHaveBeenCalled();
  });

  it('does not render an error banner by default', async () => {
    mockCancelSubscriptionMutation({success: true});
    await mountWithAppContext(<CancelSubscriptionModal {...defaultProps} />);

    expect(
      screen.queryByTitle('Unable to cancel subscription'),
    ).not.toBeInTheDocument();
  });

  it('renders an error banner when there is an error', async () => {
    mockCancelSubscriptionMutation({success: false});
    await mountWithAppContext(<CancelSubscriptionModal {...defaultProps} />);

    await clickCancelSubscriptionButton();

    expect(
      screen.getByTitle('Unable to cancel subscription'),
    ).toBeInTheDocument();
  });
});

async function clickCancelSubscriptionButton() {
  const cancelSubscriptionButton = screen.getByRole('button', {
    name: 'Cancel subscription',
  });
  await userEvent.click(cancelSubscriptionButton);
}

function mockCancelSubscriptionMutation({success = true}: {success: boolean}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionContractCancel: {
        __typename: 'SubscriptionContractCancelPayload',
        contract: {
          __typename: 'SubscriptionContract',
          id: 'gid://shopify/SubscriptionContract/1',
          status: success
            ? ('CANCELLED' as SubscriptionContractSubscriptionStatus)
            : ('ACTIVE' as SubscriptionContractSubscriptionStatus),
        },
        userErrors: success
          ? []
          : [
              {
                __typename: 'SubscriptionContractStatusUpdateUserError',
                message: 'Cannot cancel subscriptiuon because of some reason',
              },
            ],
      },
    },
  });
}
