import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  wait,
} from '#/test-utils';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {CountryCode} from 'types/admin.types';
import {describe, expect, it, vi} from 'vitest';
import {action as addressUpdateAction} from '../../../../../../app.contracts.$id.address-update/route';
import {loader} from '../../../../../route';
import {
  createMockGraphQLResponse,
  createMockShopContext,
} from '../../../../../tests/Fixtures';
import type {CustomerAddressModalProps} from '../CustomerAddressModal';
import {CustomerAddressModal} from '../CustomerAddressModal';
import {mockShopify} from '#/setup-app-bridge';

import SubscriptionContractDraftCommitMutation from '~/graphql/SubscriptionContractDraftCommitMutation';
import SubscriptionContractDraftUpdateMutation from '~/graphql/SubscriptionContractDraftUpdateMutation';

const {graphQL, mockGraphQL} = mockShopifyServer();

// The Address component uses @shopify/address to format the address
// this makes a network call that was failing in our tests
// Mocking out the address component here to avoid the error
// and still test the functionality of the modal
const AddressMock = vi.hoisted(() => {
  return ({address}) => {
    const addressString = Object.values(address).filter(Boolean).join(', ');

    return <div>{addressString}</div>;
  };
});

vi.mock('app/components/Address/Address.tsx', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...(original as any),
    Address: AddressMock,
  };
});

const mockShopContext = createMockShopContext();

const mockAddresses = [
  {
    id: '1',
    address: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '150 Test Street',
      address2: '',
      city: 'Ottawa',
      zip: '111111',
      country: 'Canada',
      province: 'ON',
      countryCode: 'CA' as CountryCode,
    },
  },
  {
    id: '2',
    address: {
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '150 Elgin Street',
      address2: '',
      city: 'Ottawa',
      zip: '111111',
      country: 'Canada',
      province: 'ON',
      countryCode: 'CA' as CountryCode,
    },
  },
];

const mockProps = {
  open: true,
  onClose: vi.fn(),
  currentContractAddress: mockAddresses[0].address,
  customerAddresses: mockAddresses,
  deliveryMethodName: 'SubscriptionDeliveryMethodShipping',
};

const mockDraftId = composeGid('SubscriptionContractDraft', 1);

const defaultGraphQLResponses = createMockGraphQLResponse({
  SubscriptionContractUpdate: {
    data: {
      subscriptionContractUpdate: {
        draft: {
          id: mockDraftId,
        },
        userErrors: [],
      },
    },
  },
  SubscriptionDraftUpdate: {
    data: {
      subscriptionDraftUpdate: {
        draft: {
          id: mockDraftId,
        },
        userErrors: [],
      },
    },
  },
  SubscriptionContractDraftDiscounts: {
    data: {
      subscriptionDraft: {
        discounts: {
          edges: [],
        },
      },
    },
  },
  SubscriptionDraftCommit: {
    data: {
      subscriptionDraftCommit: {
        contract: {
          id: composeGid('SubscriptionContract', 1),
        },
        userErrors: [],
      },
    },
  },
});

async function mountAddressModalWithRemixStub(
  props: CustomerAddressModalProps,
  graphqlResponses: object = defaultGraphQLResponses,
) {
  mockGraphQL(graphqlResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <CustomerAddressModal {...props} />,
        loader,
      },
      {
        path: `/app/contracts/:id/address-update`,
        action: addressUpdateAction,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/1`],
    },
    shopContext: mockShopContext,
  });

  return await screen.findByText('Select a different address');
}

describe('CustomerAddressModal', () => {
  it('displays the address information', async () => {
    await mountAddressModalWithRemixStub(mockProps);

    // description
    expect(screen.getByText(`Select a different address`)).toBeInTheDocument();
    expect(screen.getByText(`Cancel`)).toBeInTheDocument();
    expect(screen.getByText(`Update`)).toBeInTheDocument();
  });

  it('updates the contract with the selected address', async () => {
    await mountAddressModalWithRemixStub(mockProps);

    const selectedAddress = mockAddresses[0].address;
    const {country, province, ...address} = selectedAddress;

    const expectedAddress = {
      ...address,
      countryCode: country,
      provinceCode: province,
    };

    userEvent.click(screen.getByText('Update'));

    await wait(500);

    expect(graphQL).toHavePerformedGraphQLOperation(
      SubscriptionContractDraftUpdateMutation,
      {
        variables: {
          draftId: mockDraftId,
          input: {
            deliveryMethod: {
              shipping: {
                address: expectedAddress,
              },
            },
          },
        },
      },
    );

    expect(graphQL).toHavePerformedGraphQLOperation(
      SubscriptionContractDraftCommitMutation,
      {
        variables: {
          draftId: mockDraftId,
        },
      },
    );

    expect(mockShopify.toast.show).toHaveBeenCalledWith('Address updated', {
      isError: false,
    });
  });

  it('shows error toast when update fails', async () => {
    const mockResponses = {
      ...defaultGraphQLResponses,
      SubscriptionDraftUpdate: {
        data: {
          subscriptionDraftUpdate: {
            draft: null,
            userErrors: ['Unable to update draft'],
          },
        },
      },
    };

    await mountAddressModalWithRemixStub(mockProps, mockResponses);

    userEvent.click(screen.getByText('Update'));

    await wait(500);

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Unable to update address',
      {
        isError: true,
      },
    );
  });
});
