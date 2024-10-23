import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {beforeEach} from 'vitest';
import {screen} from '@testing-library/react';
import {faker} from '@faker-js/faker';
import {mountWithAppContext} from 'tests/utilities';

import type {SubscriptionListItemProps} from '../SubscriptionListItem';
import {SubscriptionListItem} from '../SubscriptionListItem';

const {mockExtensionApi} = mockApis();

vi.mock('../SubscriptionActions', () => {
  return {
    SubscriptionActions: vi.fn(() => null),
  };
});

describe('SubscriptionListItem', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  const defaultProps: SubscriptionListItemProps = {
    id: '1',
    firstLineName: `${faker.commerce.productName()} - ${faker.commerce.productAdjective()}}`,
    lineCount: 1,
    totalQuantity: 2,
    upcomingBillingCycles: [
      {
        cycleIndex: 0,
        skipped: false,
        billingAttemptExpectedDate: '2021-01-01',
      },
      {
        cycleIndex: 1,
        skipped: false,
        billingAttemptExpectedDate: '2021-02-01',
      },
    ],
    image: {
      id: 'gid://shopify/ImageSource/1',
      altText: null,
      url: 'shopify.com',
    },
    status: 'ACTIVE',
    deliveryPolicy: {
      interval: 'MONTH',
      intervalCount: {
        count: 1,
        precision: 'EXACT',
      },
    },
    updatedAt: '2022-09-07T15:50:00Z',
    refetchSubscriptionListData: vi.fn(),
  };

  it('renders Image component with passed image url', async () => {
    const mockProps = {
      ...defaultProps,
      image: {
        id: 'gid://shopify/ImageSource/1',
        altText: null,
        url: 'shopify.com/some_product_image.png',
      },
    };

    const {container} = await mountWithAppContext(
      <SubscriptionListItem {...mockProps} />,
    );

    const image = container.querySelector('image');

    expect(image).toHaveAttribute(
      'source',
      'shopify.com/some_product_image.png',
    );
  });

  it('renders line name if there is only one line', async () => {
    const mockProps = {
      ...defaultProps,
      lineCount: 1,
      firstLineName: 'Some product name',
    };
    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.getByText('Some product name')).toBeInTheDocument();
  });

  it('renders totalQuantity if there are multiple lines', async () => {
    const mockProps = {
      ...defaultProps,
      lineCount: 3,
      totalQuantity: 7,
      firstLineName: 'Some product name',
    };
    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.queryByText('Some product name')).not.toBeInTheDocument();
    expect(screen.getByText('7 items')).toBeInTheDocument();
  });

  it('renders the delivery frequency', async () => {
    const mockProps: SubscriptionListItemProps = {
      ...defaultProps,
      deliveryPolicy: {
        interval: 'WEEK',
        intervalCount: {
          count: 3,
          precision: 'EXACT',
        },
      },
    };
    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.getByText('Deliver every 3 weeks')).toBeInTheDocument();
  });

  it('displays the next billing date for active subscriptions', async () => {
    const mockProps: SubscriptionListItemProps = {
      ...defaultProps,
      status: 'ACTIVE',
      upcomingBillingCycles: [
        {
          cycleIndex: 0,
          skipped: false,
          billingAttemptExpectedDate: '2021-03-01T12:00:00Z',
        },
        {
          cycleIndex: 1,
          skipped: false,
          billingAttemptExpectedDate: '2021-04-01T12:00:00Z',
        },
      ],
    };
    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.getByText('Next order: Mar 1, 2021')).toBeInTheDocument();
  });

  it('displays the last updated date for non-active subscriptions', async () => {
    const mockProps: SubscriptionListItemProps = {
      ...defaultProps,
      status: 'PAUSED',
      updatedAt: '2024-07-13T15:50:00Z',
    };
    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.getByText('Last updated Jul 13')).toBeInTheDocument();
  });

  it('displays the price', async () => {
    const mockProps: SubscriptionListItemProps = {
      ...defaultProps,
      totalPrice: {
        amount: '100',
        currencyCode: 'CAD',
      },
    };

    await mountWithAppContext(<SubscriptionListItem {...mockProps} />);

    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('displays the accessibility label', async () => {
    await mountWithAppContext(<SubscriptionListItem {...defaultProps} />);
    const accessibilityLabel = `Manage subscription: ${defaultProps.firstLineName}`;

    expect(screen.getByText(accessibilityLabel)).toBeInTheDocument();
  });
});
