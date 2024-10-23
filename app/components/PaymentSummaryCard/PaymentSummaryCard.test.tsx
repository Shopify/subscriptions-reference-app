import {mountComponentWithRemixStub} from '#/test-utils';
import {screen} from '@testing-library/react';
import type {CurrencyCode} from 'types/admin.types';
import {describe, expect, it} from 'vitest';
import {
  createLocalDeliveryDeliveryMethod,
  createPickupDeliveryMethod,
  createShippingDeliveryMethod,
} from '~/routes/app.contracts.$id._index/tests/Fixtures';
import {formatPrice} from '~/utils/helpers/money';
import type {PaymentSummaryCardProps} from './PaymentSummaryCard';
import {PaymentSummaryCard} from './PaymentSummaryCard';

describe('PaymentSummaryCard', () => {
  const mockProps: PaymentSummaryCardProps = {
    subtotal: {
      amount: 12.51,
      currencyCode: 'CAD' as CurrencyCode,
    },
    totalTax: {
      amount: 1.88,
      currencyCode: 'CAD' as CurrencyCode,
    },
    totalShipping: {
      amount: 5.45,
      currencyCode: 'CAD' as CurrencyCode,
    },
    total: {
      amount: 19.84,
      currencyCode: 'CAD' as CurrencyCode,
    },
    deliveryMethod: createShippingDeliveryMethod(),
  };

  it('displays priceBreakdownEstimates in the card', async () => {
    mountComponentWithRemixStub(<PaymentSummaryCard {...mockProps} />);

    expect(
      screen.getByText(
        formatPrice({
          amount: mockProps.subtotal!.amount,
          currency: mockProps.subtotal!.currencyCode,
          locale: 'en',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatPrice({
          amount: mockProps.total!.amount,
          currency: mockProps.total!.currencyCode,
          locale: 'en',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatPrice({
          amount: mockProps.totalShipping!.amount,
          currency: mockProps.totalShipping!.currencyCode,
          locale: 'en',
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatPrice({
          amount: mockProps.totalTax!.amount,
          currency: mockProps.totalTax!.currencyCode,
          locale: 'en',
        }),
      ),
    ).toBeInTheDocument();
  });

  const mockShippingDelivery = {
    ...mockProps,
    deliveryMethod: createShippingDeliveryMethod(),
  };

  it('displays shipping option delivery method name title in the card', async () => {
    mountComponentWithRemixStub(
      <PaymentSummaryCard {...mockShippingDelivery} />,
    );

    if (mockShippingDelivery!.deliveryMethod!.shippingOption.title) {
      expect(
        screen.getByText(
          mockShippingDelivery!.deliveryMethod!.shippingOption.title,
        ),
      ).toBeInTheDocument();
    }
  });

  const mockPropsLocalDelivery = {
    ...mockProps,
    deliveryMethod: createLocalDeliveryDeliveryMethod(),
  };

  it('displays local delivery option delivery method name title in the card', async () => {
    mountComponentWithRemixStub(
      <PaymentSummaryCard {...mockPropsLocalDelivery} />,
    );

    if (mockPropsLocalDelivery?.deliveryMethod?.localDeliveryOption.title) {
      expect(
        screen.getByText(
          mockPropsLocalDelivery?.deliveryMethod?.localDeliveryOption.title,
        ),
      ).toBeInTheDocument();
    }
  });

  const mockPropsLocalPickup = {
    ...mockProps,
    deliveryMethod: createPickupDeliveryMethod(),
  };

  it('does not display local pickup delivery method name title in the card', async () => {
    mountComponentWithRemixStub(
      <PaymentSummaryCard {...mockPropsLocalPickup} />,
    );

    if (mockPropsLocalPickup?.deliveryMethod?.pickupOption.title) {
      expect(
        screen.queryByText(
          mockPropsLocalPickup!.deliveryMethod!.pickupOption.title,
        ),
      ).not.toBeInTheDocument();
    }
  });
});
