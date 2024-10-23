import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen, waitFor} from '@testing-library/react';

import type {SubscriptionContractSubscriptionStatus} from 'generatedTypes/customer.types';

import {
  RESUME_MODAL_ID,
  ResumeSubscriptionModal,
} from '../ResumeSubscriptionModal';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';
import userEvent from '@testing-library/user-event';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

const defaultProps = {
  contractId: 'gid://shopify/SubscriptionContract/1',
  resumeDate: '2021-05-07T00:00:00',
  lastOrderPrice: {
    amount: '10.00',
    currencyCode: 'CAD',
  },
  nextOrderPrice: {
    amount: '10.00',
    currencyCode: 'CAD',
  },
  onResumeSubscription: vi.fn(),
};

describe('<ResumeSubscriptionModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders', async () => {
    await mountWithAppContext(<ResumeSubscriptionModal {...defaultProps} />);

    expect(screen.getByTitle('Resume subscription')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Continue'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Close'})).toBeInTheDocument();
  });

  it('renders with resume date when passed', async () => {
    await mountWithAppContext(
      <ResumeSubscriptionModal
        {...defaultProps}
        resumeDate="2021-05-07T12:00:00"
      />,
    );

    expect(
      screen.getByText(
        'If you resume this subscription, billing will resume on May 7, 2021.',
      ),
    ).toBeInTheDocument();
  });

  it('renders generic description if no resume date is passed', async () => {
    await mountWithAppContext(
      <ResumeSubscriptionModal {...defaultProps} resumeDate={undefined} />,
    );

    expect(
      screen.getByText(
        'If you resume this subscription, billing will resume immediately.',
      ),
    ).toBeInTheDocument();
  });

  it('renders price changed message if next order price is different from last order price', async () => {
    await mountWithAppContext(
      <ResumeSubscriptionModal
        {...defaultProps}
        resumeDate={undefined}
        lastOrderPrice={{
          amount: '10.00',
          currencyCode: 'CAD',
        }}
        nextOrderPrice={{
          amount: '20.00',
          currencyCode: 'CAD',
        }}
      />,
    );

    expect(
      screen.getByText(
        'If you resume this subscription, billing will resume immediately. The price for this subscription has changed and you will be charged $20.00 per upcoming order.',
      ),
    ).toBeInTheDocument();
  });

  it('does not render price if it has not changed since the last order', async () => {
    await mountWithAppContext(
      <ResumeSubscriptionModal
        {...defaultProps}
        resumeDate={undefined}
        lastOrderPrice={{
          amount: '10.00',
          currencyCode: 'CAD',
        }}
        nextOrderPrice={{
          amount: '10.00',
          currencyCode: 'CAD',
        }}
      />,
    );

    expect(screen.queryByText('$10.00')).not.toBeInTheDocument();
  });

  it('closes the modal when close button is clicked', async () => {
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});

    await mountWithAppContext(<ResumeSubscriptionModal {...defaultProps} />);

    await clickCloseButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(RESUME_MODAL_ID);
  });

  it('calls onResumeSubscription and onClose after successfully activating a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onResumeSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockActivateSubscriptionMutation({success: true});

    await mountWithAppContext(
      <ResumeSubscriptionModal
        {...defaultProps}
        onResumeSubscription={onResumeSpy}
      />,
    );

    await clickContinueButton();

    expect(overlayCloseSpy).toHaveBeenCalledWith(RESUME_MODAL_ID);
    expect(onResumeSpy).toHaveBeenCalled();
  });

  it('does not call onClose or onResumeSubscription after failing to activate a contract', async () => {
    const overlayCloseSpy = vi.fn();
    const onResumeSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockActivateSubscriptionMutation({success: false});

    await mountWithAppContext(
      <ResumeSubscriptionModal
        {...defaultProps}
        onResumeSubscription={onResumeSpy}
      />,
    );

    await clickContinueButton();

    expect(overlayCloseSpy).not.toHaveBeenCalled();
    expect(onResumeSpy).not.toHaveBeenCalled();
  });

  it('does not render an error banner by default', async () => {
    mockActivateSubscriptionMutation({success: true});
    await mountWithAppContext(<ResumeSubscriptionModal {...defaultProps} />);

    expect(
      screen.queryByTitle('Unable to resume subscription'),
    ).not.toBeInTheDocument();
  });

  it('renders an error banner when there is an error', async () => {
    mockActivateSubscriptionMutation({success: false});

    await mountWithAppContext(<ResumeSubscriptionModal {...defaultProps} />);

    await clickContinueButton();

    await waitFor(() => {
      expect(
        screen.getByTitle('Unable to resume subscription'),
      ).toBeInTheDocument();
    });
  });
});

async function clickContinueButton() {
  const continueButton = screen.getByRole('button', {name: 'Continue'});
  await userEvent.click(continueButton);
}

function mockActivateSubscriptionMutation({
  success = true,
}: {
  success: boolean;
}) {
  mockCustomerApiGraphQL({
    data: {
      subscriptionContractActivate: {
        __typename: 'SubscriptionContractActivatePayload',
        contract: {
          __typename: 'SubscriptionContract',
          id: 'gid://shopify/SubscriptionContract/1',
          status: success
            ? ('ACTIVE' as SubscriptionContractSubscriptionStatus)
            : ('PAUSED' as SubscriptionContractSubscriptionStatus),
        },
        userErrors: success
          ? []
          : [
              {
                __typename: 'SubscriptionContractStatusUpdateUserError',
                message:
                  'Cannot resume subscription for very important reasons',
              },
            ],
      },
    },
  });
}
