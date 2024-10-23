import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import type {CountryCode} from 'generatedTypes/customer.types';
import {screen} from '@testing-library/react';

import type {OverviewCardProps} from './OverviewCard';
import {BillingAttemptErrorType} from 'types';
import {OverviewCard} from './OverviewCard';
import userEvent from '@testing-library/user-event';
import {MockAddressFormHooks} from 'tests/mocks/address';

const mockProps: OverviewCardProps = {
  contractId: 'gid://shopify/SubscriptionContract/1',
  deliveryPolicy: {
    interval: 'MONTH',
    intervalCount: {
      count: 1,
      precision: 'EXACT',
    },
  },
  shippingAddress: {
    address1: '150 Elgin Street',
    address2: '8th Floor',
    firstName: 'John',
    lastName: 'Smith',
    city: 'Ottawa',
    province: 'ON',
    country: 'CA' as CountryCode,
    zip: 'K2P1L4',
  },
  status: 'ACTIVE',
  refetchSubscriptionContract: vi.fn(),
};

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

describe('<OverviewCard />', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
    MockAddressFormHooks();
    mockCustomerApiGraphQL({});
  });

  it('shows a button to edit the shipping address', async () => {
    await mountWithAppContext(<OverviewCard {...mockProps} />);

    expect(screen.getByLabelText('Edit shipping address')).toBeInTheDocument();
  });

  it('opens the delivery modal when the edit shipping address button is clicked', async () => {
    await mountWithAppContext(<OverviewCard {...mockProps} />);

    expect(screen.queryByTestId('delivery-modal')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Edit shipping address'));

    expect(screen.getByTestId('delivery-modal')).toBeInTheDocument();
  });

  it('shows a button to edit the pickup address', async () => {
    const mockPropsWithPickupAddress = {
      ...mockProps,
      pickupAddress: mockProps.shippingAddress,
      shippingAddress: undefined,
    };
    await mountWithAppContext(<OverviewCard {...mockPropsWithPickupAddress} />);

    expect(screen.getByLabelText('Edit pickup address')).toBeInTheDocument();
  });

  it('opens the delivery modal when the edit pickup address button is clicked', async () => {
    const mockPropsWithPickupAddress = {
      ...mockProps,
      pickupAddress: mockProps.shippingAddress,
      shippingAddress: undefined,
    };
    await mountWithAppContext(<OverviewCard {...mockPropsWithPickupAddress} />);

    expect(screen.queryByTestId('delivery-modal')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Edit pickup address'));

    expect(screen.getByTestId('delivery-modal')).toBeInTheDocument();
  });
});

it('renders the Banner when lastBillingAttemptErrorType is inventory error', async () => {
  const mockPropsWithError = {
    ...mockProps,
    lastBillingAttemptErrorType: BillingAttemptErrorType.InventoryError,
  };

  await mountWithAppContext(<OverviewCard {...mockPropsWithError} />);

  expect(
    screen.getByText(
      'Your next order may be delayed because products are out of stock',
    ),
  ).toBeInTheDocument();
});

it('does not render the Banner when lastBillingAttemptErrorType is null', async () => {
  const mockPropsWithoutError = {
    ...mockProps,
    lastBillingAttemptErrorType: null,
  };

  await mountWithAppContext(<OverviewCard {...mockPropsWithoutError} />);

  expect(
    screen.queryByText(
      'Your next order may be delayed because products are out of stock',
    ),
  ).not.toBeInTheDocument();
});
