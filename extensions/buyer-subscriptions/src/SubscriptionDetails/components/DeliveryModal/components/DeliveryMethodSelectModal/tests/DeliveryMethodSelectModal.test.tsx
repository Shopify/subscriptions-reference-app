import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';

import {faker} from '@faker-js/faker';
import {mountWithAppContext} from 'tests/utilities';
import {screen, waitFor} from '@testing-library/react';

import {createMockDeliveryOptions} from '../../../tests/mocks/deliveryOptionMocks';
import {DeliveryMethodSelectModal} from '../DeliveryMethodSelectModal';
import * as useSelectDeliveryOptionHook from '../../../hooks/useSelectDeliveryOption';
import {createMockAddress} from 'tests/mocks/address';
import userEvent from '@testing-library/user-event';
import type {InlineAddressProps} from '../components/InlineAddress';

vi.mock('../../../hooks/useSelectDeliveryOption', () => ({
  useSelectDeliveryOption: vi.fn().mockReturnValue(() => ({
    deliveryMethod: {},
    errors: [],
  })),
}));

function MockInlineAddress(props: InlineAddressProps) {
  return <div>{JSON.stringify(props.address)}</div>;
}

vi.mock('../components/InlineAddress', async () => ({
  ...(await vi.importActual('../components/InlineAddress')),
  InlineAddress: (props: any) => <MockInlineAddress {...props} />,
}));

const {mockExtensionApi} = mockApis();

async function clickSaveButton() {
  const saveButton = screen.getByRole('button', {name: 'Save'});
  await userEvent.click(saveButton);
}

describe('<DeliveryMethodSelectModal />', () => {
  const mockDeliveryOptions = createMockDeliveryOptions();
  const defaultProps = {
    selectedDeliveryHandle: mockDeliveryOptions[0].code,
    address: createMockAddress(),
    deliveryOptions: mockDeliveryOptions,
    deliveryOptionsToken: faker.string.uuid(),
    subscriptionContractId: faker.string.uuid(),
    onSelectionChange: vi.fn(),
    onSuccess: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  describe('display delivery options', () => {
    it('shows the delivery option titles', async () => {
      await mountWithAppContext(
        <DeliveryMethodSelectModal {...defaultProps} />,
      );

      mockDeliveryOptions.forEach((deliveryOption) => {
        expect(
          screen.getByText(new RegExp(deliveryOption.presentmentTitle!)),
        ).toBeInTheDocument();
      });
    });
  });

  describe('actions', () => {
    it('calls selectDeliveryOption when the save button is clicked', async () => {
      const selectDeliverySpy = vi.fn();

      // calling hook returns a function -> expect that function to be called
      vi.spyOn(
        useSelectDeliveryOptionHook,
        'useSelectDeliveryOption',
      ).mockReturnValueOnce(
        selectDeliverySpy.mockResolvedValue({
          deliveryOptions: [],
          errors: [],
        }),
      );
      await mountWithAppContext(
        <DeliveryMethodSelectModal {...defaultProps} />,
      );

      await clickSaveButton();

      expect(selectDeliverySpy).toHaveBeenCalledWith(
        mockDeliveryOptions.find(
          (option) => option.code === defaultProps.selectedDeliveryHandle,
        ),
        defaultProps.subscriptionContractId,
        defaultProps.deliveryOptionsToken,
        defaultProps.address,
        defaultProps.address.phone,
        '',
      );
    });

    it('displays errors', async () => {
      const mockError = faker.word.words();

      vi.spyOn(
        useSelectDeliveryOptionHook,
        'useSelectDeliveryOption',
      ).mockReturnValue(
        vi.fn().mockResolvedValue({
          deliveryOptions: [],
          errors: [
            {
              message: mockError,
            },
          ],
        }),
      );
      await mountWithAppContext(
        <DeliveryMethodSelectModal {...defaultProps} />,
      );

      await clickSaveButton();

      await waitFor(() => {
        expect(screen.getByText(mockError)).toBeInTheDocument();
      });
    });
  });
});
