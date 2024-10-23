import {useEffect} from 'react';

import AddressFormSettingsQuery from '../graphql/AddressFormSettingsQuery';

import type {AddressFormSettingsQuery as AddressFormSettingsQueryData} from 'generatedTypes/customer.generated';
import {useGraphqlApi} from 'foundation/Api';

export type AddressFormSettings =
  AddressFormSettingsQueryData['shop']['addressFormSettings'];

export function useAddressFormSettings({skip = false} = {}) {
  const [query, {data, loading, error}] =
    useGraphqlApi<AddressFormSettingsQueryData>();

  useEffect(() => {
    if (!skip) {
      query(AddressFormSettingsQuery);
    }
  }, [query, skip]);

  return {data, loading, error};
}
