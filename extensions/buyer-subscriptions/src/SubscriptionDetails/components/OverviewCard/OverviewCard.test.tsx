import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import type {CountryCode} from 'generatedTypes/customer.types';
import {screen} from '@testing-library/react';

import type {OverviewCardProps} from './OverviewCard';
import {OverviewCard} from './OverviewCard';
import {createMockCustomerWithPaymentMethods} from 'src/SubscriptionDetails/tests/Fixtures';
import userEvent from '@testing-library/user-event';
import {MockAddressFormHooks} from 'tests/mocks/address';

const mockProps: OverviewCardProps = {
  contractId: 'gid://shopify/SubscriptionContract/1',
  nextBillingDate: '2021-09-01',
  deliveryPolicy: {
    interval: 'MONTH',
    intervalCount: {
      count: 1,
      precision: 'EXACT',
    },
  },
  lines: [
    {
      id: 'gid://shopify/ProductVariant/1',
      name: 'Nice shirt - blue',
      title: 'Nice shirt',
      variantTitle: 'blue',
      quantity: 1,
    },
    {
      id: 'gid://shopify/ProductVariant/2',
      name: 'Nice pants - yellow',
      title: 'Nice pants',
      variantTitle: 'yellow',
      quantity: 2,
    },
  ],
  paymentInstrument: {
    id: 'gid://shopify/CustomerCreditCard/1',
    brand: 'visa',
    lastDigits: '4242',
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
    mockCustomerApiGraphQL({
      data: {
        ...createMockCustomerWithPaymentMethods({}),
      },
    });
  });

  it('renders each product title', async () => {
    await mountWithAppContext(<OverviewCard {...mockProps} />);

    mockProps.lines.forEach((line) => {
      expect(screen.getByText(line.title)).toBeInTheDocument();
    });
  });

  describe('payment instrument', () => {
    it('renders the last 4 digits', async () => {
      await mountWithAppContext(
        <OverviewCard
          {...mockProps}
          paymentInstrument={{
            id: 'gid://shopify/CustomerCreditCard/1',
            brand: 'mastercard',
            lastDigits: '4444',
          }}
        />,
      );

      expect(screen.getByText('Mastercard •••• 4444')).toBeInTheDocument();
    });

    it('renders an email address when the payment instrument is paypal', async () => {
      await mountWithAppContext(
        <OverviewCard
          {...mockProps}
          paymentInstrument={{
            id: 'gid://shopify/PaypalBillingAgreement/1',
            paypalAccountEmail: 'somegreatemail@shopify.com',
          }}
        />,
      );

      expect(
        screen.getByText('PayPal somegreatemail@shopify.com'),
      ).toBeInTheDocument();
    });
  });

  it('shows the cancel and pause buttons when the status is ACTIVE', async () => {
    const props: OverviewCardProps = {
      ...mockProps,
      status: 'ACTIVE',
    };
    await mountWithAppContext(<OverviewCard {...props} />);

    expect(
      screen.getByRole('button', {name: 'Pause subscription'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Cancel subscription'}),
    ).toBeInTheDocument();
  });

  it('shows the cancel and resume buttons when the status is PAUSED', async () => {
    const props: OverviewCardProps = {
      ...mockProps,
      status: 'PAUSED',
    };
    await mountWithAppContext(<OverviewCard {...props} />);

    expect(
      screen.getByRole('button', {name: 'Resume subscription'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Cancel subscription'}),
    ).toBeInTheDocument();
  });

  it('does not render action buttons when the status is CANCELLED', async () => {
    const props: OverviewCardProps = {
      ...mockProps,
      status: 'CANCELLED',
    };
    await mountWithAppContext(<OverviewCard {...props} />);

    expect(
      screen.queryByRole('button', {name: 'Resume subscription'}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: 'Cancel subscription'}),
    ).not.toBeInTheDocument();
  });

  it('shows a button to edit the shipping address', async () => {
    await mountWithAppContext(<OverviewCard {...mockProps} />);

    expect(screen.getByLabelText('Edit shipping address')).toBeInTheDocument();
  });

  it('opens the delivery modal when the edit shipping address button is clicked', async () => {
    await mountWithAppContext(<OverviewCard {...mockProps} />);

    expect(screen.queryByTestId('delivery-modal')).toBeNull();

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

    expect(screen.queryByTestId('delivery-modal')).toBeNull();

    await userEvent.click(screen.getByLabelText('Edit pickup address'));

    expect(screen.getByTestId('delivery-modal')).toBeInTheDocument();
  });
});
