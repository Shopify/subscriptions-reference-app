import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';

import type {PaymentInstrumentWalletType} from 'generatedTypes/customer.types';

import {
  UPDATE_PAYMENT_MODAL_ID,
  UpdatePaymentMethodModal,
} from '../UpdatePaymentMethodModal';
import type {
  PaymentMethodsQuery as PaymentMethodsQueryData,
  UpdatePaymentMethodMutationVariables,
} from 'generatedTypes/customer.generated';
import {screen, waitFor} from '@testing-library/react';
import {beforeEach} from 'vitest';
import {clickCloseButton} from 'src/SubscriptionList/components/SubscriptionListItem/tests/TestActions';
import userEvent from '@testing-library/user-event';
import {createMockCustomerWithPaymentMethods} from 'src/SubscriptionDetails/tests/Fixtures';

const {customerGraphQL, mockCustomerApiGraphQL, mockExtensionApi} = mockApis();

describe('UpdatePaymentMethodModal', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('displays one <Choice /> for each payment method', async () => {
    mockPaymentMethodsQuery({});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    const choiceInputs = screen.getAllByRole('radio');
    expect(choiceInputs).toHaveLength(2);

    expect(choiceInputs[0]).toHaveAttribute(
      'id',
      'gid://shopify/CustomerCreditCard/1',
    );
    expect(choiceInputs[1]).toHaveAttribute(
      'id',
      'gid://shopify/CustomerCreditCard/2',
    );
  });

  it('calls ui.overlay.close when close button is clicked', async () => {
    mockPaymentMethodsQuery({});
    const closeOverlaySpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: closeOverlaySpy}});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    await clickCloseButton();

    expect(closeOverlaySpy).toHaveBeenCalledWith(UPDATE_PAYMENT_MODAL_ID);
  });

  it('renders a <Choice /> for PayPal if billing agreement is present', async () => {
    mockPaymentMethodsQuery({paypalEmail: 'mytestpaypal@shopify.com'});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    const choiceInputs = screen.getAllByRole('radio');
    expect(choiceInputs).toHaveLength(3);
    expect(choiceInputs[2]).toHaveAttribute(
      'id',
      'gid://shopify/PaypalBillingAgreement/1',
    );
    expect(
      screen.getByText('PayPal mytestpaypal@shopify.com'),
    ).toBeInTheDocument();
  });

  it('displays Shop Pay option if it is the currentPaymentInstrumentId', async () => {
    mockPaymentMethodsQuery({
      edges: [
        {
          node: {
            id: 'gid://shopify/CustomerCreditCard/1',
            lastDigits: '4242',
            walletType: null,
            brand: 'visa',
          },
        },
        {
          node: {
            id: 'gid://shopify/CustomerCreditCard/2',
            lastDigits: '4243',
            walletType: 'SHOP_PAY' as PaymentInstrumentWalletType,
            brand: 'mastercard',
          },
        },
      ],
    });

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/2"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('radio')[1]).toHaveAttribute(
      'id',
      'gid://shopify/CustomerCreditCard/2',
    );
  });

  it('does not display Shop Pay option if it is not the currentPaymentInstrumentId', async () => {
    mockPaymentMethodsQuery({
      edges: [
        {
          node: {
            id: 'gid://shopify/CustomerCreditCard/1',
            lastDigits: '4242',
            walletType: null,
            brand: 'visa',
          },
        },
        {
          node: {
            id: 'gid://shopify/CustomerCreditCard/2',
            lastDigits: '4243',
            walletType: 'SHOP_PAY' as PaymentInstrumentWalletType,
            brand: 'mastercard',
          },
        },
      ],
    });

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    // there should only be 1 choice input instead of 2
    const choiceInputs = screen.getByRole('radio');
    expect(choiceInputs).toBeInTheDocument();
  });

  it('auto selects the current payment method', async () => {
    mockPaymentMethodsQuery({});
    const {container} = await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    const choiceList = container.querySelector('choicelist');

    // toHaveValue will not assert correctly on the choice list component
    // eslint-disable-next-line jest-dom/prefer-to-have-value
    expect(choiceList).toHaveAttribute(
      'value',
      'gid://shopify/CustomerCreditCard/1',
    );
  });

  it('disables the save button when selected payment method is the current payment method on the contract', async () => {
    mockPaymentMethodsQuery({});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    const saveButton = screen.getByRole('button', {name: 'Save'});
    expect(saveButton).toBeDisabled();
  });

  it('enables the save button when a new payment method is selected', async () => {
    mockPaymentMethodsQuery({});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    const saveButton = screen.getByRole('button', {name: 'Save'});
    expect(saveButton).toBeDisabled();

    const secondPaymentMethodRadioInput = screen.getAllByRole('radio')[1];
    await userEvent.click(secondPaymentMethodRadioInput);

    expect(saveButton).toBeEnabled();
  });

  it('calls UpdatePaymentMethodMutation, onPaymentMethodUpdated and overlay.close when a payment method is updated', async () => {
    const onUpdateSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockUpdatePaymentMethodMutation({});

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="gid://shopify/SubscriptionContract/1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={onUpdateSpy}
      />,
    );

    await clickSecondRadioButton();

    await clickSaveButton();

    const [updatePaymentMutationCall] = customerGraphQL();

    expect(updatePaymentMutationCall).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subscriptionContractId: 'gid://shopify/SubscriptionContract/1',
        paymentInstrumentId: 'gid://shopify/CustomerCreditCard/2',
      }),
    );

    expect(onUpdateSpy).toHaveBeenCalled();
    expect(overlayCloseSpy).toHaveBeenCalledWith(UPDATE_PAYMENT_MODAL_ID);
  });

  it('does not call ui.overlay.close or onPaymentMethodUpdated when there is an error', async () => {
    const onUpdateSpy = vi.fn();
    const overlayCloseSpy = vi.fn();
    mockExtensionApi({mocks: {closeOverlay: overlayCloseSpy}});
    mockUpdatePaymentMethodMutation({success: false});

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="gid://shopify/SubscriptionContract/1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/15"
        onPaymentMethodUpdated={onUpdateSpy}
      />,
    );

    await clickSecondRadioButton();
    await clickSaveButton();

    expect(onUpdateSpy).not.toHaveBeenCalled();
    expect(overlayCloseSpy).not.toHaveBeenCalled();
  });

  it('does not render an error banner by default', async () => {
    mockPaymentMethodsQuery({});
    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/1"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    expect(
      screen.queryByTitle('Unable to update payment method'),
    ).not.toBeInTheDocument();
  });

  it('renders an error banner when there is an error', async () => {
    mockUpdatePaymentMethodMutation({success: false});

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/6"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    await clickSecondRadioButton();
    await clickSaveButton();

    expect(
      screen.getByTitle('Unable to update payment method'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('This payment method does not exist'),
    ).toBeInTheDocument();
  });

  it('clears error state when modal onClose is called', async () => {
    mockPaymentMethodsQuery({});
    mockUpdatePaymentMethodMutation({success: false});

    await mountWithAppContext(
      <UpdatePaymentMethodModal
        opened
        contractId="1"
        currentPaymentInstrumentId="gid://shopify/CustomerCreditCard/15"
        onPaymentMethodUpdated={vi.fn()}
      />,
    );

    await clickSecondRadioButton();
    await clickSaveButton();

    expect(
      screen.getByTitle('Unable to update payment method'),
    ).toBeInTheDocument();

    await clickCloseButton();

    await waitFor(() => {
      expect(
        screen.queryByTitle('Unable to update payment method'),
      ).not.toBeInTheDocument();
    });
  });
});

async function clickSecondRadioButton() {
  const secondPaymentMethodRadioInput = screen.getAllByRole('radio')[1];
  await userEvent.click(secondPaymentMethodRadioInput);
}

async function clickSaveButton() {
  const saveButton = screen.getByRole('button', {name: 'Save'});
  await userEvent.click(saveButton);
}

function mockPaymentMethodsQuery({
  edges,
  paypalEmail,
}: {
  edges?: PaymentMethodsQueryData['customer']['creditCards']['edges'];
  paypalEmail?: string;
}) {
  mockCustomerApiGraphQL({
    data: {
      ...createMockCustomerWithPaymentMethods({edges, paypalEmail}),
    },
  });
}

function mockUpdatePaymentMethodMutation({
  validator,
  variables,
  edges,
  paypalEmail,
  success = true,
}: {
  validator?: (variables: UpdatePaymentMethodMutationVariables) => void;
  variables?: UpdatePaymentMethodMutationVariables;
  edges?: PaymentMethodsQueryData['customer']['creditCards']['edges'];
  paypalEmail?: string;
  success?: boolean;
}) {
  if (validator && variables) {
    validator?.(variables);
  }
  mockCustomerApiGraphQL({
    data: {
      ...createMockCustomerWithPaymentMethods({edges, paypalEmail}),
      subscriptionContractChangePaymentInstrument: {
        __typename: 'SubscriptionContractChangePaymentInstrumentPayload',
        contract: {
          __typename: 'SubscriptionContract',
          id: 'gid://shopify/SubscriptionContract/1',
          paymentInstrument: {
            __typename: 'CustomerCreditCard',
            id: success
              ? 'gid://shopify/CustomerCreditCard/2'
              : 'gid://shopify/CustomerCreditCard/1',
          },
        },
        userErrors: success
          ? []
          : [
              {
                __typename: 'SubscriptionContractUserError',
                message: 'This payment method does not exist',
              },
            ],
      },
    },
  });
}
