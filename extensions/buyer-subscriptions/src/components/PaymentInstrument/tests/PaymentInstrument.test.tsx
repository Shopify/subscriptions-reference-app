import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mountWithAppContext} from 'tests/utilities';
import {screen} from '@testing-library/react';

import {PaymentInstrument} from '../PaymentInstrument';
import {beforeEach} from 'vitest';

const {mockExtensionApi} = mockApis();

describe('<PaymentInstrument />', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders label with brand when there is a matching translation', async () => {
    await mountWithAppContext(
      <PaymentInstrument
        paymentInstrument={{
          id: '123',
          brand: 'visa',
          lastDigits: '4242',
        }}
      />,
    );

    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
  });

  it('renders generic label when brand has no matching translation', async () => {
    await mountWithAppContext(
      <PaymentInstrument
        paymentInstrument={{
          id: '123',
          brand: 'unknown brand',
          lastDigits: '1111',
        }}
      />,
    );

    expect(screen.getByText('•••• 1111')).toBeInTheDocument();
  });

  it('renders PayPal label when payment instrument is a paypal billing agreement', async () => {
    await mountWithAppContext(
      <PaymentInstrument
        paymentInstrument={{
          id: '123',
          paypalAccountEmail: 'somegreatemail@shopify.com',
        }}
      />,
    );

    expect(
      screen.getByText('PayPal somegreatemail@shopify.com'),
    ).toBeInTheDocument();
  });

  it('renders <PaymentIcon /> with name when there is no walletType', async () => {
    const {container} = await mountWithAppContext(
      <PaymentInstrument
        paymentInstrument={{
          id: '123',
          brand: 'visa',
          lastDigits: '4242',
          walletType: null,
        }}
      />,
    );

    const icon = container.querySelector('paymenticon');

    expect(icon).toHaveAttribute('name', 'visa');
  });

  it('renders <PaymentIcon /> with wallet type when present', async () => {
    const {container} = await mountWithAppContext(
      <PaymentInstrument
        paymentInstrument={{
          id: '123',
          brand: 'visa',
          lastDigits: '4242',
          walletType: 'SHOP_PAY',
        }}
      />,
    );

    const icon = container.querySelector('paymenticon');

    expect(icon).toHaveAttribute('name', 'SHOP_PAY');
  });
});
