import {mockUiExtensionComponents} from 'tests/mocks/components';
import {mockApis} from 'tests/mocks/api';
import {mockUseToast} from 'tests/mocks/toast';
import {screen, waitFor} from '@testing-library/react';
import {mountWithAppContext} from 'tests/utilities';
import type {
  CountryCode,
  SubscriptionContractSubscriptionStatus,
  CurrencyCode,
} from 'generatedTypes/customer.types';

import {SubscriptionDetails} from '../SubscriptionDetails';
import type {graphqlSubscriptionContract} from './Fixtures';
import {createMockSubscriptionContractDetails} from './Fixtures';
import {SuccessToastType} from 'utilities/hooks/useToast';
import userEvent from '@testing-library/user-event';

const {mockCustomerApiGraphQL, mockExtensionApi} = mockApis();
const {mockShowSuccessToast} = mockUseToast();

describe('<SubscriptionDetails />', () => {
  beforeEach(() => {
    mockUiExtensionComponents();
    mockExtensionApi();
    mockCustomerApiGraphQL({});
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

      // The details are rendered twice, and hidden depending on window size
      expect(screen.getAllByText('Express Shipping')).toHaveLength(2);

      await waitFor(() => {
        expect(screen.getAllByText('150 Elgin Street')).toHaveLength(2);
      });

      expect(screen.getAllByText('8th Floor')).toHaveLength(2);
      expect(screen.getAllByText('Ottawa Ontario K2P1L4')).toHaveLength(2);
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

      // The details are rendered twice, and hidden depending on window size
      expect(screen.getAllByText('Fast and free local delivery')).toHaveLength(
        2,
      );

      await waitFor(() => {
        expect(screen.getAllByText('150 Elgin Street')).toHaveLength(2);
      });

      expect(screen.getAllByText('8th Floor')).toHaveLength(2);
      expect(screen.getAllByText('Ottawa Ontario K2P1L4')).toHaveLength(2);
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

      // The details are rendered twice, and hidden depending on window size
      await waitFor(() => {
        expect(screen.getAllByText('150 Elgin Street')).toHaveLength(2);
      });

      expect(screen.getAllByText('8th Floor')).toHaveLength(2);
      expect(screen.getAllByText('Ottawa Ontario K2P1L4')).toHaveLength(2);
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

  describe('subscription details actions', () => {
    it('shows pause and cancel buttons when status is active', async () => {
      mockSubscription({
        status: 'ACTIVE' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByRole('button', {name: 'Pause'})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {name: 'Resume'}),
      ).not.toBeInTheDocument();
    });

    it('shows resume and cancel buttons when status is paused', async () => {
      mockSubscription({
        status: 'PAUSED' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(screen.getByRole('button', {name: 'Resume'})).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {name: 'Pause'}),
      ).not.toBeInTheDocument();
    });

    it('does not show any action buttons when the status is cancelled', async () => {
      mockSubscription({
        status: 'CANCELLED' as SubscriptionContractSubscriptionStatus,
      });

      await mountWithAppContext(<SubscriptionDetails id="1" />);

      expect(
        screen.queryByRole('button', {name: 'Pause'}),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {name: 'Resume'}),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {name: 'Cancel'}),
      ).not.toBeInTheDocument();
    });

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

      await userEvent.click(screen.getByRole('button', {name: 'Pause'}));
      await userEvent.click(
        screen.getByRole('button', {name: 'Pause subscription'}),
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

      await userEvent.click(screen.getByRole('button', {name: 'Resume'}));
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

      await userEvent.click(screen.getByRole('button', {name: 'Cancel'}));
      await userEvent.click(
        screen.getByRole('button', {name: 'Cancel subscription'}),
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

      await userEvent.click(screen.getByRole('button', {name: 'Resume'}));

      expect(
        screen.getByText(
          /If you resume this subscription, billing will resume on May 26, 2023\./,
        ),
      ).toBeInTheDocument();
    });
  });
});

function mockSubscription({
  orders,
  lines,
  status,
  deliveryMethod,
  notFound = false,
  error = false,
}: {
  orders?: graphqlSubscriptionContract['orders'];
  lines?: graphqlSubscriptionContract['lines'];
  status?: SubscriptionContractSubscriptionStatus;
  deliveryMethod?: graphqlSubscriptionContract['deliveryMethod'];
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
              lines,
              status,
              deliveryMethod,
            }),
      },
    },
    error: error ? new Error('test error from mockSubscription') : undefined,
  });
}
