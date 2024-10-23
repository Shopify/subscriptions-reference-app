import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';

import {mountComponentWithRemixStub} from '#/test-utils';
import {faker} from '@faker-js/faker';
import type {CountryCode} from 'types/admin.types';
import type {CustomerAddress} from '~/types/contracts';
import {CustomerDetailsCard} from '../CustomerDetailsCard';

describe('CustomerDetailsCard', () => {
  const mockAddress: Omit<CustomerAddress, 'id'> = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    address1: faker.location.streetAddress(false),
    address2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    zip: faker.location.zipCode(),
    countryCode: 'CA' as CountryCode,
    provinceCode: 'QC',
  };

  const mockProps = {
    customer: {
      id: 'gid://shopify/Customer/1',
      displayName: faker.person.fullName(),
      email: faker.internet.email(),
      addresses: [],
    },
    deliveryMethod: {
      name: 'SubscriptionDeliveryMethodShipping',
      isLocalPickup: false,
      address: mockAddress,
      shippingOption: {
        title: 'standard shipping',
      },
    },
    subscriptionContractId: 'gid://shopify/SubscriptionContract/1',
  };

  it('displays the customer name and email', async () => {
    mountComponentWithRemixStub(<CustomerDetailsCard {...mockProps} />);

    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(
      screen.getByText(mockProps.customer.displayName),
    ).toBeInTheDocument();
    expect(screen.getByText('Contact information')).toBeInTheDocument();
    expect(screen.getByText(mockProps.customer.email)).toBeInTheDocument();
  });

  it('displays the formatted shipping address', async () => {
    mountComponentWithRemixStub(<CustomerDetailsCard {...mockProps} />);

    const expectedAddressLine1 = `${mockAddress.firstName} ${mockAddress.lastName}`;
    const expectedAddressLine4 = `${mockAddress.city} Quebec ${mockAddress.zip}`;

    // wait for the address formatter to finish running
    await waitFor(async () => {
      expect(await screen.findByText('Shipping address')).toBeInTheDocument();
    });

    await waitFor(async () => {
      expect(await screen.findByText(expectedAddressLine1)).toBeInTheDocument();
    });

    expect(await screen.findByText(mockAddress.address1!)).toBeInTheDocument();
    expect(await screen.findByText(mockAddress.address2!)).toBeInTheDocument();
    expect(await screen.findByText(expectedAddressLine4)).toBeInTheDocument();
    expect(await screen.findByText('Canada')).toBeInTheDocument();
  });

  it('displays phone number from local delivery', async () => {
    const mockLocalDeliveryMethod = {
      isLocalPickup: false,
      address: mockAddress,
      localDeliveryOption: {
        title: faker.word.words(),
        phone: faker.phone.number(),
      },
      name: 'SubscriptionDeliveryMethodLocalDelivery',
    };

    const props = {
      ...mockProps,
      deliveryMethod: mockLocalDeliveryMethod,
    };

    mountComponentWithRemixStub(<CustomerDetailsCard {...props} />);

    const expectedAddressLine1 = `${mockAddress.firstName} ${mockAddress.lastName}`;

    await waitFor(() => {
      expect(screen.getByText('Shipping address')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(expectedAddressLine1)).toBeInTheDocument();
    });
    expect(
      screen.getByText(mockLocalDeliveryMethod.localDeliveryOption.phone),
    ).toBeInTheDocument();
  });

  it('does not display the address section if some required fields are missing', async () => {
    const props = {
      ...mockProps,
      deliveryMethod: {
        ...mockProps.deliveryMethod,
        address: {
          ...mockProps.deliveryMethod.address,
          address1: null,
        },
      },
    };
    mountComponentWithRemixStub(<CustomerDetailsCard {...props} />);

    expect(screen.queryByText('Shipping address')).not.toBeInTheDocument();
  });

  it('does not display the address section if the subscription has local pickup', async () => {
    const props = {
      ...mockProps,
      deliveryMethod: {
        name: 'SubscriptionDeliveryMethodPickup',
        isLocalPickup: true,
        pickupOption: {
          title: faker.location.streetAddress(),
        },
      },
    };
    mountComponentWithRemixStub(<CustomerDetailsCard {...props} />);

    expect(screen.queryByText('Shipping address')).not.toBeInTheDocument();
  });

  it('opens the address menu when the edit button is clicked', async () => {
    mountComponentWithRemixStub(<CustomerDetailsCard {...mockProps} />);

    const editButton = screen.getByRole('button');
    await userEvent.click(editButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Select a different address')).toBeInTheDocument();
    expect(
      screen.getByText('Manage addresses on customer page'),
    ).toBeInTheDocument();
  });
});
