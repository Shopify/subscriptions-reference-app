import {useEffect, useState} from 'react';
import type {Country} from '@shopify/address';
import AddressFormatter from '@shopify/address';
import {useExtensionApi} from 'foundation/Api';

export function useCountries({skip = false} = {}) {
  const {localization} = useExtensionApi();
  const [state, setState] = useState<{
    data: Country[];
    loading: boolean;
    error: unknown;
  }>({
    data: [],
    loading: true,
    error: null,
  });
  const locale = localization.extensionLanguage.current.isoCode;

  useEffect(() => {
    let mounted = true;

    const addressFormatter = new AddressFormatter(locale);

    const getCountries = async () => {
      let newState;

      try {
        const countries = await addressFormatter.getCountries();

        newState = {error: null, data: countries, loading: false};
      } catch (error) {
        newState = {data: [], loading: false, error};
      }

      if (mounted) setState(newState);
    };

    if (!skip) {
      getCountries();
    }

    return () => {
      mounted = false;
    };
  }, [locale, skip]);

  return state;
}
