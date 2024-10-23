import {mountComponentWithRemixStub} from '#/test-utils';
import {screen} from '@testing-library/react';
import type {CurrencyCode} from 'types/admin.types';
import {describe, expect, it} from 'vitest';
import {SubscriptionLineItem} from '../SubscriptionLineItem';

const mockLine = {
  id: 'gid://shopify/LineItem/123456789',
  title: 'Durable Orange Chair',
  variantTitle: 'Largest size',
  variantImage: {
    url: 'url',
    altText: 'altText',
  },
  currentPrice: {
    amount: 15,
    currencyCode: 'USD' as CurrencyCode,
  },
  pricingPolicy: {
    basePrice: {
      amount: 20,
      currencyCode: 'USD' as CurrencyCode,
    },
    cycleDiscounts: [],
  },
  lineDiscountedPrice: {
    amount: 45,
    currencyCode: 'USD' as CurrencyCode,
  },
  quantity: 3,
  productId: 'gid://shopify/Product/123456789',
};

describe('SubscriptionLineItem', () => {
  it('Renders product and variant title', () => {
    mountComponentWithRemixStub(<SubscriptionLineItem line={mockLine} />);

    expect(screen.getByText('Durable Orange Chair')).toBeInTheDocument();
    expect(screen.getByText('Largest size')).toBeInTheDocument();
  });

  it('renders one time purchase price', () => {
    mountComponentWithRemixStub(<SubscriptionLineItem line={mockLine} />);

    expect(
      screen.getByText('One-time purchase price: $20.00'),
    ).toBeInTheDocument();
  });

  it('renders line price per item', () => {
    mountComponentWithRemixStub(<SubscriptionLineItem line={mockLine} />);

    expect(screen.getByText('$15.00')).toBeInTheDocument();
  });

  it('renders line discounted price', () => {
    mountComponentWithRemixStub(<SubscriptionLineItem line={mockLine} />);

    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('renders line quantity', () => {
    mountComponentWithRemixStub(<SubscriptionLineItem line={mockLine} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
