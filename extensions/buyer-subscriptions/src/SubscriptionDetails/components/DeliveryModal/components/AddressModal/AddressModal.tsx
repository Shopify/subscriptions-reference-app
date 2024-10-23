import {useCallback, useMemo} from 'react';
import {
  BlockStack,
  InlineStack,
  InlineLayout,
  Button,
  SkeletonText,
  SkeletonTextBlock,
  Banner,
} from '@shopify/ui-extensions-react/customer-account';

import type {Address as AddressType} from '@shopify/address';
import {buildOrderedFields} from '@shopify/address';
import type {UserError} from 'types';

import {useCountries} from '../../hooks/useCountries';
import {AddressLine} from '../AddressLine';
import {formatUserErrorsForFields} from '../../utilities/helpers';
import {DELIVERY_MODAL_ID} from '../../types';
import {useExtensionApi} from 'foundation/Api';

interface AddressModalProps {
  address: AddressType;
  addressModalOpen: boolean;
  errors: UserError[];
  handleAddressChange: (newValue: Partial<AddressType>) => void;
  loading: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export function AddressModal({
  address,
  addressModalOpen,
  errors,
  handleAddressChange,
  loading,
  onClose,
  onSave,
}: AddressModalProps) {
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();

  const errorMessageDisplay = useMemo(
    () => errors.map(({message}) => message).join('\n'),
    [errors],
  );

  const {data: countries, loading: countriesLoading} = useCountries({
    skip: !addressModalOpen,
  });

  const countrySelectOptions = useMemo(
    () =>
      countries.map(({code, name}) => {
        return {value: code, label: name};
      }),
    [countries],
  );

  const onModalClose = useCallback(() => {
    onClose();
    overlay.close(DELIVERY_MODAL_ID);
  }, [onClose, overlay]);

  if (countriesLoading) {
    return (
      <>
        <BlockStack spacing="loose" data-testid="address-modal-loading-state">
          {new Array(4).fill(0).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <BlockStack spacing="tight" key={index}>
              <SkeletonText inlineSize="small" />
              <SkeletonTextBlock />
            </BlockStack>
          ))}
        </BlockStack>
      </>
    );
  }

  const {country} = address;

  const currentCountry = countries?.find(({code}) => code === country);

  if (!currentCountry) {
    throw new Error(`Country ${country} not found`);
  }

  const orderedFields = buildOrderedFields(currentCountry);

  const zoneSelectOptions = currentCountry.zones.map(({code, name}) => {
    return {value: code, label: name};
  });

  return (
    <>
      <BlockStack>
        {errorMessageDisplay ? (
          <Banner status="critical" title={errorMessageDisplay} />
        ) : null}
        <BlockStack>
          {orderedFields.map((line, index) => {
            return (
              <AddressLine
                // eslint-disable-next-line react/no-array-index-key
                key={`$line-${index}`}
                line={line}
                countries={countries}
                country={currentCountry}
                address={address}
                countrySelectOptions={countrySelectOptions}
                zoneSelectOptions={zoneSelectOptions}
                onChange={handleAddressChange}
                formErrors={formatUserErrorsForFields([])}
                disabled={loading}
              />
            );
          })}
          <InlineLayout inlineAlignment="end" columns={['fill']}>
            <></>
            <InlineStack blockAlignment="center">
              <Button kind="plain" onPress={onModalClose}>
                {i18n.translate('addressModal.cancel')}
              </Button>
              <Button onPress={onSave} loading={loading}>
                {i18n.translate('addressModal.continue')}
              </Button>
            </InlineStack>
          </InlineLayout>
        </BlockStack>
      </BlockStack>
    </>
  );
}
