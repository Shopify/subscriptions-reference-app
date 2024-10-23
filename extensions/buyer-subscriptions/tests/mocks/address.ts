import {faker} from '@faker-js/faker';
import type {Address, Country} from '@shopify/address';

import * as useCountries from '../../src/SubscriptionDetails/components/DeliveryModal/hooks/useCountries';

export function createMockAddress(address?: Partial<Address>): Address {
  return {
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    country: faker.location.countryCode(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    province: faker.location.state(),
    zip: faker.location.zipCode(),
    phone: faker.phone.number(),
    ...address,
  };
}

export function mockUseCountries() {
  return {
    data: createMockCountriesList(),
    loading: false,
    error: null,
  };
}

export function createMockCountriesList(): Country[] {
  return [
    {
      name: 'Canada',
      code: 'CA',
      continent: 'North America',
      phoneNumberPrefix: 1,
      autocompletionField: 'address1',
      provinceKey: 'PROVINCE',
      labels: {
        address1: 'Address',
        address2: 'Apartment, suite, etc.',
        city: 'City',
        company: 'Company',
        country: 'Country/region',
        firstName: 'First name',
        lastName: 'Last name',
        phone: 'Phone',
        postalCode: 'Postal code',
        zone: 'Province',
      },
      optionalLabels: {
        address2: 'Apartment, suite, etc. (optional)',
      },
      formatting: {
        edit: '{country}_{firstName}{lastName}_{company}_{address1}_{address2}_{city}{province}{zip}_{phone}',
        show: '{firstName} {lastName}_{company}_{address1}_{address2}_{city} {province} {zip}_{country}_{phone}',
      },
      zones: [
        {
          name: 'Ontario',
          code: 'ON',
        },
        {
          name: 'Quebec',
          code: 'QC',
        },
      ],
    },
    {
      name: 'United States',
      code: 'US',
      continent: 'North America',
      phoneNumberPrefix: 1,
      autocompletionField: 'address1',
      provinceKey: 'STATE',
      labels: {
        address1: 'Address',
        address2: 'Apartment, suite, etc.',
        city: 'City',
        company: 'Company',
        country: 'Country/region',
        firstName: 'First name',
        lastName: 'Last name',
        phone: 'Phone',
        postalCode: 'ZIP code',
        zone: 'State',
      },
      optionalLabels: {
        address2: 'Apartment, suite, etc. (optional)',
      },
      formatting: {
        edit: '{country}_{firstName}{lastName}_{company}_{address1}_{address2}_{city}{province}{zip}_{phone}',
        show: '{firstName} {lastName}_{company}_{address1}_{address2}_{city} {province} {zip}_{country}_{phone}',
      },
      zones: [
        {
          name: 'California',
          code: 'CA',
        },
        {
          name: 'Florida',
          code: 'FL',
        },
        {
          name: 'New York',
          code: 'NY',
        },
      ],
    },
    {
      name: 'Vatican City',
      code: 'VA',
      continent: 'Europe',
      phoneNumberPrefix: 39,
      autocompletionField: 'address1',
      provinceKey: 'REGION',
      labels: {
        address1: 'Address',
        address2: 'Apartment, suite, etc.',
        city: 'City',
        company: 'Company',
        country: 'Country/region',
        firstName: 'First name',
        lastName: 'Last name',
        phone: 'Phone',
        postalCode: 'Postal code',
        zone: 'Region',
      },
      optionalLabels: {
        address2: 'Apartment, suite, etc. (optional)',
      },
      formatting: {
        edit: '{country}_{firstName}{lastName}_{company}_{address1}_{address2}_{phone}',
        show: '{firstName} {lastName}_{company}_{address1}_{address2}_{zip} {country}_{phone}',
      },
      zones: [],
    },
  ];
}

export function MockAddressFormHooks() {
  vi.spyOn(useCountries, 'useCountries').mockImplementation(() =>
    mockUseCountries(),
  );
}
