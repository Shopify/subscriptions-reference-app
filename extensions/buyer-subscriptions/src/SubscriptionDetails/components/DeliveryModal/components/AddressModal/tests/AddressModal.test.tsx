import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen} from '@testing-library/react';

import {AddressModal} from '../..';
import * as useCountries from '../../../hooks/useCountries';
import {MockAddressFormHooks, createMockAddress} from 'tests/mocks/address';

const {mockExtensionApi} = mockApis();

describe('<AddressModal />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
    MockAddressFormHooks();
  });

  const mockAddress = createMockAddress({country: 'CA', province: 'ON'});
  const defaultProps = {
    address: mockAddress,
    currentAddress: mockAddress,
    addressModalOpen: true,
    errors: [],
    loading: false,
    onClose: vi.fn(),
    onSave: vi.fn(),
    handleAddressChange: vi.fn(),
  };

  it('renders address lines', async () => {
    await mountWithAppContext(<AddressModal {...defaultProps} />);

    expect(screen.getByText('Country/region')).toBeInTheDocument();
    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('Province')).toBeInTheDocument();
    expect(screen.getByText('Postal code')).toBeInTheDocument();
  });

  it('shows different countries in the dropdown', async () => {
    await mountWithAppContext(<AddressModal {...defaultProps} />);

    expect(screen.getByRole('option', {name: 'Canada'})).toBeInTheDocument();
    expect(
      screen.getByRole('option', {name: 'United States'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', {name: 'Vatican City'}),
    ).toBeInTheDocument();
  });

  describe('loading state', () => {
    it('renders skeleton text while countries are loading', async () => {
      vi.spyOn(useCountries, 'useCountries').mockImplementation(() => ({
        data: [],
        loading: true,
        error: undefined,
      }));

      await mountWithAppContext(<AddressModal {...defaultProps} />);

      expect(
        screen.getByTestId('address-modal-loading-state'),
      ).toBeInTheDocument();
    });

    it('disables the text inputs while loading', async () => {
      await mountWithAppContext(<AddressModal {...defaultProps} loading />);

      expect(screen.getByRole('textbox', {name: 'First name'})).toBeDisabled();
    });
  });
});
