import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen} from '@testing-library/react';
import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

import {
  PAUSE_MODAL_ID,
  PauseSubscriptionModal,
} from '../PauseSubscriptionModal';
import userEvent from '@testing-library/user-event';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

const defaultProps = {
  contractId: 'gid://shopify/SubscriptionContract/1',
  onPauseSubscription: vi.fn(),
};

describe('<PauseSubscriptionModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders with the pause button', async () => {
    await mountWithAppContext(<PauseSubscriptionModal {...defaultProps} />);

    expect(screen.getByTitle('Pause subscription')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Pause subscription',
      }),
    ).toBeInTheDocument();
  });

  it('calls ui.overlay.close when close button is clicked', async () => {
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<PauseSubscriptionModal {...defaultProps} />);

    await clickCloseButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(PAUSE_MODAL_ID);
  });

  it('calls onPauseSubscription and ui.overlay.close after successfully pausing a contract', async () => {
    const onPauseSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    mockPauseSubscriptionMutation({success: true});
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(
      <PauseSubscriptionModal
        {...defaultProps}
        onPauseSubscription={onPauseSpy}
      />,
    );

    await clickPauseButton();

    expect(onPauseSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(PAUSE_MODAL_ID);
  });

  it('does not call onPauseSubscription after failing to pause a contract', async () => {
    mockPauseSubscriptionMutation({success: false});
    const onPauseSpy = vi.fn();

    await mountWithAppContext(
      <PauseSubscriptionModal
        {...defaultProps}
        onPauseSubscription={onPauseSpy}
      />,
    );

    await clickPauseButton();

    expect(onPauseSpy).not.toHaveBeenCalled();
  });

  it('does not call ui.overlay.close or onPauseSubscription and shows an error banner after failing to pause a contract', async () => {
    const onPauseSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    mockPauseSubscriptionMutation({success: false});
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(
      <PauseSubscriptionModal
        {...defaultProps}
        onPauseSubscription={onPauseSpy}
      />,
    );

    await clickPauseButton();

    expect(onPauseSpy).not.toHaveBeenCalled();
    expect(overlayCloseSpy).not.toHaveBeenCalled();

    expect(
      screen.getByTitle('Unable to pause subscription'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cannot pause contract with future cycle edits'),
    ).toBeInTheDocument();
  });

  it('does not render error banner by default', async () => {
    mockPauseSubscriptionMutation({success: true});

    await mountWithAppContext(<PauseSubscriptionModal {...defaultProps} />);

    expect(
      screen.queryByTitle('Unable to pause subscription'),
    ).not.toBeInTheDocument();
  });
});

async function clickPauseButton() {
  const pauseButton = screen.getByRole('button', {
    name: 'Pause subscription',
  });
  await userEvent.click(pauseButton);
}

function mockPauseSubscriptionMutation({success = true}: {success: boolean}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionContractPause: {
        __typename: 'SubscriptionContractPausePayload',
        contract: {
          __typename: 'SubscriptionContract',
          id: 'gid://shopify/SubscriptionContract/1',
          status: success
            ? ('PAUSED' as SubscriptionContractSubscriptionStatus)
            : ('ACTIVE' as SubscriptionContractSubscriptionStatus),
        },
        userErrors: success
          ? []
          : [
              {
                __typename: 'SubscriptionContractStatusUpdateUserError',
                message: 'Cannot pause contract with future cycle edits',
              },
            ],
      },
    },
  });
}
