import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import {faker} from '@faker-js/faker';
import CustomerPaymentMethodSendUpdateEmailMutation from '~/graphql/CustomerPaymentMethodSendUpdateEmailMutation';
import {action as paymentUpdateAction} from '../../../../../../app.contracts.$id.payment-update/route';
import {loader} from '../../../../../route';
import {
  createMockCreditCardInstrument,
  createMockGraphQLResponse,
  createMockGraphqlCustomer,
  createMockShopContext,
} from '../../../../../tests/Fixtures';
import type {CustomerPaymentMethodEmailModalProps} from '../CustomerPaymentMethodEmailModal';
import {CustomerPaymentMethodEmailModal} from '../CustomerPaymentMethodEmailModal';
import {mockShopify} from '#/setup-app-bridge';

const {graphQL, mockGraphQL} = mockShopifyServer();

const mockCustomer = createMockGraphqlCustomer();
const mockCreditCard = createMockCreditCardInstrument();
const mockShopContext = createMockShopContext();

const mockProps = {
  open: true,
  onClose: vi.fn(),
  instrument: mockCreditCard,
  customerEmail: mockCustomer.email!,
  customerDisplayName: mockCustomer.displayName,
};

const defaultGraphQLResponses = createMockGraphQLResponse();

const mockPaymentMethodId = 'gid://shopify/CustomerPaymentMethod/123';
const mockCustomerEmail = 'somecustomer@email.com';
const mockShopContactEmail = 'noreply@shopify.com';
const mockShopName = 'Snowdevil';

const mockPaymentDetailsResponse = {
  PaymentUpdateDetails: {
    data: {
      shop: {
        name: mockShopName,
        contactEmail: mockShopContactEmail,
      },
      subscriptionContract: {
        id: defaultGraphQLResponses.SubscriptionContractDetails.data
          .subscriptionContract.id,
        customer: {
          email: mockCustomerEmail,
        },
        customerPaymentMethod: {
          id: mockPaymentMethodId,
        },
      },
    },
  },
};

async function mountEmailModalWithRemixStub(
  props: CustomerPaymentMethodEmailModalProps,
  graphqlResponses: object = defaultGraphQLResponses,
) {
  mockGraphQL(graphqlResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <CustomerPaymentMethodEmailModal {...props} />,
        loader,
      },
      {
        path: `/app/contracts/:id/payment-update`,
        action: paymentUpdateAction,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/1`],
    },
    shopContext: mockShopContext,
  });

  return await screen.findByText('Send link to update card');
}

describe('CustomerPaymentMethodEmailModal', () => {
  it('displays the email information', async () => {
    await mountEmailModalWithRemixStub(mockProps);

    // description
    expect(
      screen.getByText(
        `Send a link to ${mockCustomer.displayName} to update their credit card ending in ${mockCreditCard.lastDigits}`,
      ),
    ).toBeInTheDocument();

    // from
    expect(screen.getByText(mockShopContext.contactEmail)).toBeInTheDocument();

    // to
    expect(screen.getByText(mockCustomer.email!)).toBeInTheDocument();

    // subject
    expect(
      screen.getByText(
        `Update your payment method for ${mockShopContext.name}`,
      ),
    ).toBeInTheDocument();
  });

  it('displays errors in the toast', async () => {
    const mockGraphQLResponses = createMockGraphQLResponse({
      CustomerPaymentMethodSendUpdateEmail: {
        data: {
          customerPaymentMethodSendUpdateEmail: {
            customer: {
              id: mockCustomer.id,
            },
            userErrors: [
              {
                field: ['email'],
                message: faker.lorem.sentence(),
              },
            ],
          },
        },
      },
      ...mockPaymentDetailsResponse,
    });

    await mountEmailModalWithRemixStub(mockProps, mockGraphQLResponses);

    await userEvent.click(screen.getByRole('button', {name: 'Send email'}));
    await waitForGraphQL();

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to send customer payment method update email',
      {isError: true},
    );
  });

  it('calls the mutation to send an email to the customer, closes modal, shows toast', async () => {
    const mockGraphQLResponses = {
      ...defaultGraphQLResponses,
      ...mockPaymentDetailsResponse,
    };

    await mountEmailModalWithRemixStub(mockProps, mockGraphQLResponses);

    await userEvent.click(screen.getByRole('button', {name: 'Send email'}));
    await waitForGraphQL();

    expect(graphQL).toHavePerformedGraphQLOperation(
      CustomerPaymentMethodSendUpdateEmailMutation,
      {
        variables: {
          customerPaymentMethodId: mockPaymentMethodId,
          emailInput: {
            from: mockShopContactEmail,
            to: mockCustomerEmail,
            subject: `Update your payment method for ${mockShopName}`,
          },
        },
      },
    );

    expect(mockProps.onClose).toHaveBeenCalled();
    expect(mockShopify.toast.show).toHaveBeenCalledWith('Email sent', {
      isError: false,
    });
  });
});
