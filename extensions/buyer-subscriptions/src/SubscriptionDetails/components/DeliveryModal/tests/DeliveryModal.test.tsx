import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';

import {screen, waitFor} from '@testing-library/react';

import {faker} from '@faker-js/faker';
import type {CurrencyCode} from 'generatedTypes/customer.types';

import {DeliveryModal} from '../DeliveryModal';
import {DELIVERY_MODAL_ID} from '../types';
import * as useFetchDeliveryOptionsHook from '../hooks/useFetchDeliveryOptions';
import {MockAddressFormHooks, createMockAddress} from 'tests/mocks/address';
import userEvent from '@testing-library/user-event';

const {mockExtensionApi} = mockApis();

vi.mock('../hooks/useFetchDeliveryOptions', () => ({
  useFetchDeliveryOptions: vi.fn().mockReturnValue(
    vi.fn().mockReturnValue({
      deliveryOptions: [
        {
          __typename: 'SubscriptionShippingOption',
          code: 'delivery-123',
          title: 'Delivery Option 123',
          presentmentTitle: 'Delivery Option 123 presentment title',
          phoneRequired: false,
          price: {
            __typename: 'MoneyV2',
            amount: '10.00',
            currencyCode: 'CAD' as CurrencyCode,
          },
        },
      ],
      deliveryOptionsToken: faker.string.uuid(),
      errors: [],
    }),
  ),
}));

async function clickContinueButton() {
  const continueButton = screen.getByRole('button', {name: 'Continue'});
  await userEvent.click(continueButton);
}

async function clickCancelButton() {
  const cancelButton = screen.getByRole('button', {name: 'Cancel'});
  await userEvent.click(cancelButton);
}

describe('<DeliveryModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
    MockAddressFormHooks();
  });

  const defaultProps = {
    currentAddress: createMockAddress({country: 'CA', province: 'ON'}),
    subscriptionContractId: '123',
    addressModalOpen: true,
    refetchSubscriptionContract: vi.fn(),
    onClose: vi.fn(),
  };

  describe('state', () => {
    it('shows the address modal initially', async () => {
      const {container} = await mountWithAppContext(
        <DeliveryModal {...defaultProps} />,
      );

      expect(container.querySelector('modal')).toHaveAttribute(
        'title',
        'Edit shipping address',
      );
    });

    it('switches to the delivery method selection modal once continue is clicked', async () => {
      const {container} = await mountWithAppContext(
        <DeliveryModal {...defaultProps} />,
      );

      await clickContinueButton();

      await waitFor(() => {
        expect(container.querySelector('modal')).toHaveAttribute(
          'title',
          'Select delivery method',
        );
      });
    });

    it('switches back to the address modal once cancel is clicked in the delivery method selection modal', async () => {
      const {container} = await mountWithAppContext(
        <DeliveryModal {...defaultProps} />,
      );

      await clickContinueButton();
      await waitFor(() => {
        expect(container.querySelector('modal')).toHaveAttribute(
          'title',
          'Select delivery method',
        );
      });

      await clickCancelButton();
      await waitFor(() => {
        expect(container.querySelector('modal')).toHaveAttribute(
          'title',
          'Edit shipping address',
        );
      });
    });

    it('does not proceed to delivery selection and displays an error when there are no delivery options', async () => {
      const mockError = faker.word.words();
      vi.spyOn(
        useFetchDeliveryOptionsHook,
        'useFetchDeliveryOptions',
      ).mockReturnValue(
        vi.fn().mockResolvedValue({
          deliveryOptions: [],
          errors: [{message: mockError}],
        }),
      );

      const {container} = await mountWithAppContext(
        <DeliveryModal {...defaultProps} />,
      );

      await clickContinueButton();

      expect(screen.getByTitle(mockError)).toBeInTheDocument();

      expect(container.querySelector('modal')).toHaveAttribute(
        'title',
        'Edit shipping address',
      );
    });
  });

  describe('buttons', () => {
    it('fetches delivery options when the continue button is clicked', async () => {
      const fetchDeliverySpy = vi.fn();

      vi.spyOn(
        useFetchDeliveryOptionsHook,
        'useFetchDeliveryOptions',
      ).mockReturnValue(
        fetchDeliverySpy.mockResolvedValue({
          deliveryOptions: [],
          deliveryOptionsToken: faker.string.uuid(),
          errors: [],
        }),
      );

      await mountWithAppContext(<DeliveryModal {...defaultProps} />);

      await clickContinueButton();

      expect(fetchDeliverySpy).toHaveBeenCalled();
    });

    it('closes the modal when the cancel button is clicked', async () => {
      const closeOverlaySpy = vi.fn();
      mockExtensionApi({mocks: {closeOverlay: closeOverlaySpy}});

      await mountWithAppContext(<DeliveryModal {...defaultProps} />);

      await clickCancelButton();

      expect(closeOverlaySpy).toHaveBeenCalledWith(DELIVERY_MODAL_ID);
    });
  });

  describe('address fields', () => {
    it('changes the field set depending on which country is selected', async () => {
      await mountWithAppContext(<DeliveryModal {...defaultProps} />);

      const currentFieldLabels = [
        'First name',
        'Last name',
        'Address',
        'City',
        'Postal code',
      ];

      const newFieldLabels = ['First name', 'Last name', 'Address'];
      const removedFieldLabels = ['City', 'Postal code'];

      currentFieldLabels.forEach((field) => {
        expect(screen.getByLabelText(field)).toBeInTheDocument();
      });

      const countrySelector = screen.getAllByRole('combobox')[0];
      await userEvent.click(countrySelector);

      await userEvent.selectOptions(countrySelector, ['VA']);

      newFieldLabels.forEach((field) => {
        expect(screen.getByLabelText(field)).toBeInTheDocument();
      });

      removedFieldLabels.forEach((field) => {
        expect(screen.queryByLabelText(field)).not.toBeInTheDocument();
      });
    });
  });
});
