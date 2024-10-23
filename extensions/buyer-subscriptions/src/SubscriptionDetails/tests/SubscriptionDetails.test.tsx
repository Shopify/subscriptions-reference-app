import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mockApis} from 'tests/mocks/api';
import {mockUseToast} from 'tests/mocks/toast';
import {faker} from '@faker-js/faker';
import {screen, waitFor} from '@testing-library/react';
import {mountWithAppContext} from 'tests/utilities';
import type {
  CountryCode,
  SubscriptionContractSubscriptionStatus,
  CurrencyCode,
} from 'generatedTypes/customer.types';

import {SubscriptionDetails} from '../SubscriptionDetails';
import type {graphqlSubscriptionContract} from './Fixtures';
import {
  createMockCustomerWithPaymentMethods,
  createMockSubscriptionContractDetails,
} from './Fixtures';
import {SuccessToastType} from 'utilities/hooks/useToast';
import userEvent from '@testing-library/user-event';

const {mockCustomerApiGraphQL, mockExtensionApi} = mockApis();
const {mockShowSuccessToast} = mockUseToast();

describe('<SubscriptionDetails />', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
    mockCustomerApiGraphQL({
      data: {
        ...createMockCustomerWithPaymentMethods({}),
      },
    });
  });

  it('renders NotFound for non-existent contracts', async () => {
    mockSubscription({notFound: true});

    await mountWithAppContext(<SubscriptionDetails id="1" />);

    expect(screen.getByText('Subscription not found')).toBeInTheDocument();
    expect(
      screen.getByText(
        "This subscription doesn't exist or you don't have permission to view it.",
      ),
    ).toBeInTheDocument();
  });

  it('throws an error when the API call fails', async () => {
    mockSubscription({error: true});

    await expect(
      mountWithAppContext(<SubscriptionDetails id="1" />),
    ).rejects.toThrow('test error from mockSubscription');
  });

  it('renders Manage subscription title for non-cancelled contracts', async () => {
    mockSubscription({
      status: 'ACTIVE' as SubscriptionContractSubscriptionStatus,
    });

    await mountWithAppContext(<SubscriptionDetails id="1" />);

    expect(screen.getByText('Manage subscription')).toBeInTheDocument();
  });

  it('renders Subscription details for cancelled contracts', async () => {
    mockSubscription({
      status: 'CANCELLED' as SubscriptionContractSubscriptionStatus,
    });

    await mountWithAppContext(<SubscriptionDetails id="1" />);

    expect(screen.getByText('Subscription details')).toBeInTheDocument();
  });

  describe('<PastOrdersCard />', () => {
    it('renders one item for each order returned', async () => {
      mockSubscription({
        orders: {
          edges: [
            {
              node: {
                id: 'gid://shopify/Order/1',
                createdAt: '2023-09-07T15:50:00Z',
                totalPrice: {
                  amount: '100',
                  currencyCode: 'CAD' as CurrencyCode,
                },
              },
            },
            {
              node: {
                id: 'gid://shopify/Order/2',
                createdAt: '2022-01-04T15:50:00Z',
                totalPrice: {
                  amount: '100',
                  currencyCode: 'CAD' as CurrencyCode,
                },
              },
            },
          ],
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByText('Jan 4, 2022')).toBeInTheDocument();
      expect(screen.getByText('Sep 7, 2023')).toBeInTheDocument();
      expect(screen.getAllByText('View')).toHaveLength(2);
    });
  });

  describe('<OverviewCard />', () => {
    it('Displays information about the payment instrument', async () => {
      mockSubscription({
        paymentInstrument: {
          id: 'gid://shopify/CustomerCreditCard/1',
          brand: 'visa',
          lastDigits: '4242',
          expiryMonth: Number(faker.date.month()),
          expiryYear: Number(faker.date.future().getFullYear()),
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
    });

    it('is passed a customer credit card billing address', async () => {
      mockSubscription({
        paymentInstrument: {
          id: 'gid://shopify/CustomerCreditCard/1',
          brand: 'visa',
          lastDigits: '4242',
          expiryMonth: Number(faker.date.month()),
          expiryYear: Number(faker.date.future().getFullYear()),
          billingAddress: {
            address1: '150 Elgin Street',
            city: 'Ottawa',
            provinceCode: 'ON',
            countryCode: 'CA' as CountryCode,
            zip: 'K2P1L4',
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      // wait for the address formatter to return a formatted address
      await waitFor(() => {
        expect(screen.getByText('150 Elgin Street')).toBeInTheDocument();
      });

      expect(screen.getByText('Ottawa Ontario K2P1L4')).toBeInTheDocument();
    });

    it('Displays payment information for PayPal billing agreements', async () => {
      mockSubscription({
        paymentInstrument: {
          id: 'gid://shopify/PaypalBillingAgreement/1',
          paypalAccountEmail: 'noreply@shopify.com',
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(
        screen.getByText('PayPal noreply@shopify.com'),
      ).toBeInTheDocument();
    });

    it('Displays the billing address for PayPal billing agreements', async () => {
      mockSubscription({
        paymentInstrument: {
          id: 'gid://shopify/PaypalBillingAgreement/1',
          paypalAccountEmail: 'noreply@shopify.com',
          billingAddress: {
            address1: '1 Main street',
            city: 'New York City',
            provinceCode: 'NY',
            countryCode: 'US' as CountryCode,
            zip: '10118',
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await waitFor(() => {
        expect(screen.getByText('1 Main street')).toBeInTheDocument();
      });

      expect(
        screen.getByText('New York City New York 10118'),
      ).toBeInTheDocument();
    });

    it('Displays the delivery method and shipping address when method is shipping', async () => {
      mockSubscription({
        deliveryMethod: {
          address: {
            address1: '150 Elgin Street',
            address2: '8th Floor',
            firstName: 'John',
            lastName: 'Smith',
            city: 'Ottawa',
            provinceCode: 'ON',
            countryCode: 'CA' as CountryCode,
            zip: 'K2P1L4',
          },
          shippingOption: {
            presentmentTitle: 'Express Shipping',
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByText('Express Shipping')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('150 Elgin Street')).toBeInTheDocument();
      });

      expect(screen.getByText('8th Floor')).toBeInTheDocument();
      expect(screen.getByText('Ottawa Ontario K2P1L4')).toBeInTheDocument();
    });

    it('Displays the delivery method title and address when method is local delivery', async () => {
      mockSubscription({
        deliveryMethod: {
          address: {
            address1: '150 Elgin Street',
            address2: '8th Floor',
            firstName: 'John',
            lastName: 'Smith',
            city: 'Ottawa',
            provinceCode: 'ON',
            countryCode: 'CA' as CountryCode,
            zip: 'K2P1L4',
          },
          localDeliveryOption: {
            presentmentTitle: 'Fast and free local delivery',
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(
        screen.getByText('Fast and free local delivery'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('150 Elgin Street')).toBeInTheDocument();
      });

      expect(screen.getByText('8th Floor')).toBeInTheDocument();
      expect(screen.getByText('Ottawa Ontario K2P1L4')).toBeInTheDocument();
    });

    it('is passed the pickup address when method is pickup in store', async () => {
      mockSubscription({
        deliveryMethod: {
          pickupOption: {
            pickupAddress: {
              address1: '150 Elgin Street',
              address2: '8th Floor',
              city: 'Ottawa',
              zoneCode: 'ON',
              countryCode: 'CA' as CountryCode,
              zip: 'K2P1L4',
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await waitFor(() => {
        expect(screen.getByText('150 Elgin Street')).toBeInTheDocument();
      });

      expect(screen.getByText('8th Floor')).toBeInTheDocument();
      expect(screen.getByText('Ottawa Ontario K2P1L4')).toBeInTheDocument();
    });
  });

  describe('<UpcomingOrderCard />', () => {
    it('is rendered when contract status is ACTIVE', async () => {
      mockSubscription({
        status: 'ACTIVE' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByText('Upcoming order')).toBeInTheDocument();
    });

    it('is not rendered when contract status is PAUSED', async () => {
      mockSubscription({
        status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.queryByText('Upcoming order')).not.toBeInTheDocument();
    });

    it('is not rendered when contract status is CANCELLED', async () => {
      mockSubscription({
        status: 'CANCELLED' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.queryByText('Upcoming order')).not.toBeInTheDocument();
    });
  });

  describe('<PriceSummaryCard />', () => {
    it('renders the Price Summary card', async () => {
      mockSubscription({
        priceBreakdownEstimate: {
          subtotalPrice: {
            amount: '100',
            currencyCode: 'USD' as CurrencyCode,
          },
          totalTax: {
            amount: '3',
            currencyCode: 'USD' as CurrencyCode,
          },
          totalShippingPrice: {
            amount: '20',
            currencyCode: 'USD' as CurrencyCode,
          },
          totalPrice: {
            amount: '123',
            currencyCode: 'USD' as CurrencyCode,
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();

      expect(screen.getByText('Taxes')).toBeInTheDocument();
      expect(screen.getByText('$3.00')).toBeInTheDocument();

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('$20.00')).toBeInTheDocument();

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$123.00')).toBeInTheDocument();
    });
  });

  describe('Invalid payment banner', () => {
    it('shows the invalid payment banner when the payment method is expired', async () => {
      mockSubscription({
        paymentInstrument: {
          id: 'gid://shopify/CustomerCreditCard/1',
          brand: 'visa',
          lastDigits: '4242',
          expiryMonth: 1,
          expiryYear: 1990,
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(
        screen.getByTitle(
          'Visa ending in 4242 is invalid. Update the payment method below to continue receiving upcoming orders',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Success toasts', () => {
    it('shows a success toast when a subscription is paused', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            subscriptionContract: createMockSubscriptionContractDetails({}),
            creditCards: {
              edges: [],
            },
          },
          subscriptionContractPause: {
            contract: {
              status: 'PAUSED',
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(
        screen.getByRole('button', {name: 'Pause subscription'}),
      );
      await userEvent.click(
        screen.getAllByRole('button', {name: 'Pause subscription'})[1],
      );

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Paused);
    });

    it('shows a success toast when a subscription is resumed', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            subscriptionContract: createMockSubscriptionContractDetails({
              status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
            }),
            creditCards: {
              edges: [],
            },
          },
          subscriptionContractActivate: {
            contract: {
              status: 'ACTIVE',
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(
        screen.getByRole('button', {name: 'Resume subscription'}),
      );
      await userEvent.click(screen.getByRole('button', {name: 'Continue'}));

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Resumed);
    });

    it('shows a success toast when the next order is skipped', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            subscriptionContract: createMockSubscriptionContractDetails({}),
            creditCards: {
              edges: [],
            },
          },
          subscriptionBillingCycleSkip: {
            billingCycle: {
              skipped: true,
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(screen.getByRole('button', {name: 'Skip'}));
      await userEvent.click(screen.getAllByRole('button', {name: 'Skip'})[1]);

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Skipped);
    });

    it('shows a success toast when a subscription is cancelled', async () => {
      const showToastSpy = vi.fn();
      mockShowSuccessToast(showToastSpy);
      mockCustomerApiGraphQL({
        data: {
          customer: {
            subscriptionContract: createMockSubscriptionContractDetails({}),
            creditCards: {
              edges: [],
            },
          },
          subscriptionContractCancel: {
            contract: {
              status: 'CANCELLED' as SubscriptionContractSubscriptionStatus,
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(
        screen.getByRole('button', {name: 'Cancel subscription'}),
      );
      await userEvent.click(
        screen.getAllByRole('button', {name: 'Cancel subscription'})[1],
      );

      expect(showToastSpy).toHaveBeenCalledWith(SuccessToastType.Cancelled);
    });
  });

  describe('<ResumeSubscriptionModal />', () => {
    it('Displays the resume date from the first unskipped billing cycle', async () => {
      mockSubscription({
        status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
      });

      mockCustomerApiGraphQL({
        data: {
          customer: {
            subscriptionContract: createMockSubscriptionContractDetails({
              status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
            }),
            creditCards: {
              edges: [],
            },
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(
        screen.getByRole('button', {name: 'Resume subscription'}),
      );

      expect(
        screen.getByText(
          'If you resume this subscription, billing will resume on May 26, 2023.',
        ),
      ).toBeInTheDocument();
    });

    it('is passed last order price and price breakdown total as next order total', async () => {
      mockSubscription({
        status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
        orders: {
          edges: [
            {
              node: {
                id: 'gid://shopify/Order/2',
                createdAt: '2023-09-07T15:50:00Z',
                totalPrice: {
                  amount: '150',
                  currencyCode: 'CAD' as CurrencyCode,
                },
              },
            },
            {
              node: {
                id: 'gid://shopify/Order/1',
                createdAt: '2022-01-04T15:50:00Z',
                totalPrice: {
                  amount: '100',
                  currencyCode: 'CAD' as CurrencyCode,
                },
              },
            },
          ],
        },
        priceBreakdownEstimate: {
          subtotalPrice: {
            amount: '500',
            currencyCode: 'CAD' as CurrencyCode,
          },
          totalTax: {
            amount: '3',
            currencyCode: 'CAD' as CurrencyCode,
          },
          totalShippingPrice: {
            amount: '20',
            currencyCode: 'CAD' as CurrencyCode,
          },
          totalPrice: {
            amount: '523',
            currencyCode: 'CAD' as CurrencyCode,
          },
        },
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      await userEvent.click(
        screen.getByRole('button', {name: 'Resume subscription'}),
      );

      expect(
        screen.getByText(
          /The price for this subscription has changed and you will be charged \$523\.00 per upcoming order/,
        ),
      ).toBeInTheDocument();
    });
  });
});

function mockSubscription({
  orders,
  status,
  paymentInstrument,
  deliveryMethod,
  priceBreakdownEstimate,
  notFound = false,
  error = false,
}: {
  orders?: graphqlSubscriptionContract['orders'];
  status?: SubscriptionContractSubscriptionStatus;
  paymentInstrument?: graphqlSubscriptionContract['paymentInstrument'];
  deliveryMethod?: graphqlSubscriptionContract['deliveryMethod'];
  priceBreakdownEstimate?: graphqlSubscriptionContract['priceBreakdownEstimate'];
  lastOrderTotal?: string;
  notFound?: boolean;
  error?: boolean;
}) {
  mockCustomerApiGraphQL({
    data: {
      customer: {
        creditCards: {
          edges: [],
        },
        subscriptionContract: notFound
          ? undefined
          : createMockSubscriptionContractDetails({
              orders,
              status,
              paymentInstrument,
              deliveryMethod,
              priceBreakdownEstimate,
            }),
      },
    },
    error: error ? new Error('test error from mockSubscription') : undefined,
  });
}
