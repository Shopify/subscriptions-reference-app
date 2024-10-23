import {faker} from '@faker-js/faker';
import type {CountryCode, CurrencyCode} from 'generatedTypes/customer.types';
import type {DeliveryOption} from 'types';
import {createMockAddress} from 'tests/mocks/address';

export function createMockDeliveryOptions({
  includeShipping = true,
  includeLocalPickup = true,
  includeLocalDelivery = true,
} = {}): DeliveryOption[] {
  const mockPickupAddress = createMockAddress();

  const deliveryOptions: DeliveryOption[] = [];

  // using conditional + spread operator causes linting issues with __typename
  if (includeShipping) {
    deliveryOptions.push({
      __typename: 'SubscriptionShippingOption',
      code: 'Shipping',
      title: 'Shipping',
      presentmentTitle: 'Shipping',
      phoneRequired: false,
      price: {
        amount: '12.00',
        currencyCode: 'CAD' as CurrencyCode,
      },
    });
  }

  if (includeLocalPickup) {
    deliveryOptions.push({
      __typename: 'SubscriptionPickupOption',
      code: 'Local pickup',
      title: 'Local pickup',
      presentmentTitle: 'Local pickup',
      phoneRequired: true,
      price: {
        amount: '0',
        currencyCode: 'CAD' as CurrencyCode,
      },
      description: 'Pick it up locally',
      locationId: faker.string.uuid(),
      pickupAddress: {
        ...mockPickupAddress,
        countryCode: mockPickupAddress.country as CountryCode,
        provinceCode: mockPickupAddress.province,
      },
      pickupTime: faker.date.future().toISOString(),
    });
  }

  if (includeLocalDelivery) {
    deliveryOptions.push({
      __typename: 'SubscriptionLocalDeliveryOption',
      code: 'Local delivery',
      title: 'Local delivery',
      presentmentTitle: 'Local delivery',
      phoneRequired: true,
      price: {
        amount: '3.00',
        currencyCode: 'CAD' as CurrencyCode,
      },
      description: faker.word.words(),
    });
  }

  return deliveryOptions;
}
