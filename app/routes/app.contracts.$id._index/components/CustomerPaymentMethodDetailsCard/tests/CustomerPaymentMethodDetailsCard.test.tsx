import {mountComponentWithRemixStub} from '#/test-utils';
import {faker} from '@faker-js/faker';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import type {
  CustomerPaymentMethod,
  CustomerPaypalBillingAgreement,
} from '~/types/contracts';
import {
  createMockCreditCardInstrument,
  createMockCustomer,
  createMockPaypalInstrument,
  createMockShopPayAgreement,
} from '../../../tests/Fixtures';
import {CustomerPaymentMethodDetailsCard} from '../CustomerPaymentMethodDetailsCard';

describe('CustomerPaymentMethodDetailsCard', () => {
  const mockCreditCardInstrument = createMockCreditCardInstrument();

  const mockCustomerPaymentMethod: CustomerPaymentMethod = {
    id: 'gid://shopify/CustomerPaymentMethod/123',
    instrument: mockCreditCardInstrument,
  };

  const mockProps = {
    customerPaymentMethod: mockCustomerPaymentMethod,
    customer: createMockCustomer(),
  };

  it('renders the masked number and brand for credit cards', async () => {
    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard {...mockProps} />,
    );

    expect(
      screen.getByText(`Visa ${mockCreditCardInstrument.maskedNumber}`),
    ).toBeInTheDocument();
  });

  it('renders the expiration date for credit cards', async () => {
    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard {...mockProps} />,
    );

    expect(screen.getByText(`Expires 12/24`)).toBeInTheDocument();
  });

  it('pads expiry expiry months and years', async () => {
    const mockProps00 = {
      ...mockProps,
      customerPaymentMethod: {
        ...mockCustomerPaymentMethod,
        instrument: {
          ...mockCreditCardInstrument,
          expiryMonth: 4,
          expiryYear: 3000,
        },
      },
    };

    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard {...mockProps00} />,
    );

    expect(screen.getByText(`Expires 04/00`)).toBeInTheDocument();
  });

  it('displays the paypal email for paypal payment methods', async () => {
    const mockPaypalBillingAgreement = createMockPaypalInstrument();

    const paymentMethodWithPaypal: CustomerPaymentMethod = {
      id: 'gid://shopify/CustomerPaymentMethod/123',
      instrument: mockPaypalBillingAgreement,
    };

    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard
        customer={mockProps.customer}
        customerPaymentMethod={paymentMethodWithPaypal}
      />,
    );

    expect(
      screen.getByText(mockPaypalBillingAgreement.paypalAccountEmail!),
    ).toBeInTheDocument();
  });

  it('opens the edit menu when the edit button is clicked', async () => {
    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard {...mockProps} />,
    );

    const editButton = screen.getByRole('button');
    await userEvent.click(editButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Send link to update card')).toBeInTheDocument();
    expect(
      screen.getByText('Manage payment on customer page'),
    ).toBeInTheDocument();
  });

  it('displays the revoked date when payment method is revoked', async () => {
    const revokedAt = '2024-09-01T15:50:00Z';

    const mockPropsWithRevokedPaymentMethod = {
      ...mockProps,
      customerPaymentMethod: {
        ...mockCustomerPaymentMethod,
        revokedAt,
      },
    };

    mountComponentWithRemixStub(
      <CustomerPaymentMethodDetailsCard
        {...mockPropsWithRevokedPaymentMethod}
      />,
    );

    expect(
      screen.getByText(
        `Payment method was removed by customer on September 1, 2024`,
      ),
    ).toBeInTheDocument();
  });

  describe('icons', () => {
    it('renders the icon for credit cards', async () => {
      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...mockProps} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/visa.svg');
    });

    it('renders the icon for paypal', async () => {
      const props = {
        ...mockProps,
        customerPaymentMethod: {
          ...mockProps.customerPaymentMethod,
          instrument: {
            __typename: 'CustomerPaypalBillingAgreement',
            paypalAccountEmail: faker.internet.email(),
          } as CustomerPaypalBillingAgreement,
        },
      };
      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...props} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/paypal.svg');
    });

    it('renders the icon for shop pay', async () => {
      const shopPayInstrument = createMockShopPayAgreement();

      const props = {
        ...mockProps,
        customerPaymentMethod: {
          ...mockProps.customerPaymentMethod,
          instrument: shopPayInstrument,
        },
      };

      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...props} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/shoppay.svg');
    });

    it('renders the icon for google pay', async () => {
      const googlePayCreditCard = createMockCreditCardInstrument({
        source: 'google_pay',
      });

      const props = {
        ...mockProps,
        customerPaymentMethod: {
          ...mockProps.customerPaymentMethod,
          instrument: googlePayCreditCard,
        },
      };

      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...props} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/googlepay.svg');
    });

    it('renders the icon for apple pay', async () => {
      const applePayCreditCard = createMockCreditCardInstrument({
        source: 'apple_pay',
      });

      const props = {
        ...mockProps,
        customerPaymentMethod: {
          ...mockProps.customerPaymentMethod,
          instrument: applePayCreditCard,
        },
      };

      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...props} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/applepay.svg');
    });

    it('renders a generic icon and no brand text when the brand is not recognized', async () => {
      const unknownBrandCreditCard = createMockCreditCardInstrument({
        brand: 'unknown',
        lastDigits: '1234',
        maskedNumber: '•••• •••• •••• 1234',
      });

      const props = {
        ...mockProps,
        customerPaymentMethod: {
          ...mockProps.customerPaymentMethod,
          instrument: unknownBrandCreditCard,
        },
      };

      mountComponentWithRemixStub(
        <CustomerPaymentMethodDetailsCard {...props} />,
      );

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('src', '/images/paymentIcons/generic.svg');

      expect(
        screen.getByText(unknownBrandCreditCard.maskedNumber),
      ).toBeInTheDocument();
    });
  });
});
