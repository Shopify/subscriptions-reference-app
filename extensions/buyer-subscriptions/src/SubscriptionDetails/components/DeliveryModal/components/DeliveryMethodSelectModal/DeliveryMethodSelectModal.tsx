import {
  BlockStack,
  ChoiceList,
  Choice,
  Text,
  InlineStack,
  Grid,
  InlineLayout,
  Button,
  Banner,
  View,
  TextField,
  PhoneField,
} from '@shopify/ui-extensions-react/customer-account';

import type {Address} from '@shopify/address';

import type {DeliveryOption, UserError} from 'types';
import {useMemo, useState} from 'react';

import {DELIVERY_MODAL_ID} from '../../types';
import {useSelectDeliveryOption} from '../../hooks/useSelectDeliveryOption';
import {
  deliveryOptionIsLocalDelivery,
  deliveryOptionIsLocalPickup,
} from '../../utilities/helpers';

import {InlineAddress} from './components';
import {useExtensionApi} from 'foundation/Api';

interface DeliveryMethodSelectModalProps {
  selectedDeliveryHandle: string;
  address: Address;
  deliveryOptions: DeliveryOption[];
  deliveryOptionsToken?: string;
  subscriptionContractId: string;
  onSelectionChange: (newDeliveryHandle: string) => void;
  onSuccess: () => void;
  onClose: () => void;
}

export function DeliveryMethodSelectModal({
  deliveryOptions,
  address,
  selectedDeliveryHandle,
  deliveryOptionsToken,
  subscriptionContractId,
  onSelectionChange,
  onSuccess,
  onClose,
}: DeliveryMethodSelectModalProps) {
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();
  const selectDeliveryOption = useSelectDeliveryOption();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<UserError[]>([]);

  const [deliveryPhoneNumber, setDeliveryPhoneNumber] = useState<string>(
    address.phone || '',
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');

  const selectedDeliveryOption = useMemo(
    () =>
      deliveryOptions.find((option) => option.code === selectedDeliveryHandle),
    [deliveryOptions, selectedDeliveryHandle],
  );

  const choices = deliveryOptions.map((deliveryOption) => {
    const {code, price, presentmentTitle} = deliveryOption;

    const displayLocalDeliveryInputs =
      selectedDeliveryOption &&
      deliveryOptionIsLocalDelivery(selectedDeliveryOption) &&
      deliveryOptionIsLocalDelivery(deliveryOption);

    const isLocalPickup = deliveryOptionIsLocalPickup(deliveryOption);
    const choiceTitle = isLocalPickup
      ? i18n.translate('deliveryMethodSelectModal.localPickupOption', {
          location: presentmentTitle,
        })
      : presentmentTitle;

    return (
      <BlockStack key={code}>
        <Grid columns={['fill', 'auto']}>
          <Choice id={code} disabled={loading}>
            <Text>{choiceTitle}</Text>
            {isLocalPickup
              ? (() => {
                  const pickupAddress = {
                    country: deliveryOption.pickupAddress.countryCode,
                    province: deliveryOption.pickupAddress.provinceCode,
                    ...deliveryOption.pickupAddress,
                  } as Address;

                  return (
                    <View>
                      <InlineAddress
                        address={pickupAddress}
                        appearance="subdued"
                      />
                    </View>
                  );
                })()
              : null}
          </Choice>
          <Text appearance="subdued">
            {/* if it doesn't have a price it must be free... */}
            {price && Number(price.amount) !== 0
              ? i18n.formatCurrency(Number(price.amount), {
                  currency: price?.currencyCode,
                  currencyDisplay: 'narrowSymbol',
                })
              : i18n.translate('deliveryMethodSelectModal.free')}
          </Text>
        </Grid>
        {displayLocalDeliveryInputs ? (
          <View padding={['none', 'base']}>
            <BlockStack>
              <BlockStack spacing="extraTight">
                <PhoneField
                  value={deliveryPhoneNumber}
                  onChange={setDeliveryPhoneNumber}
                  label={i18n.translate(
                    'deliveryMethodSelectModal.localDeliveryPhoneLabel',
                  )}
                />
                <Text appearance="subdued">
                  {i18n.translate(
                    'deliveryMethodSelectModal.localDeliveryPhoneDetails',
                  )}
                </Text>
              </BlockStack>
              <BlockStack spacing="extraTight">
                <TextField
                  value={deliveryInstructions}
                  onChange={setDeliveryInstructions}
                  label={i18n.translate(
                    'deliveryMethodSelectModal.localDeliveryInstructionsLabel',
                  )}
                />
                <Text appearance="subdued">
                  {i18n.translate(
                    'deliveryMethodSelectModal.localDeliveryInstructionsDetails',
                  )}
                </Text>
              </BlockStack>
            </BlockStack>
          </View>
        ) : null}
      </BlockStack>
    );
  });

  async function handleSave() {
    if (deliveryOptionsToken && selectedDeliveryOption) {
      setLoading(true);

      const {deliveryMethod, errors} = await selectDeliveryOption(
        selectedDeliveryOption,
        subscriptionContractId,
        deliveryOptionsToken,
        address,
        deliveryPhoneNumber,
        deliveryInstructions,
      );

      setLoading(false);

      if (errors && errors.length > 0) {
        setErrors(errors);
        return;
      }

      if (deliveryMethod) {
        onSuccess();
        overlay.close(DELIVERY_MODAL_ID);
      }
    }
  }

  const errorMessageDisplay = useMemo(
    () => errors.map(({message}) => message).join('\n'),
    [errors],
  );

  return (
    <BlockStack>
      {errorMessageDisplay ? (
        <Banner status="critical" title={errorMessageDisplay} />
      ) : null}
      <ChoiceList
        name="deliveryOptionsChoiceList"
        value={selectedDeliveryHandle}
        onChange={onSelectionChange}
      >
        <BlockStack>{choices}</BlockStack>
      </ChoiceList>
      <InlineLayout inlineAlignment="end" columns={['fill']}>
        <></>
        <InlineStack blockAlignment="center">
          <Button kind="plain" onPress={onClose}>
            {i18n.translate('addressModal.cancel')}
          </Button>
          <Button onPress={handleSave} loading={loading}>
            {i18n.translate('addressModal.save')}
          </Button>
        </InlineStack>
      </InlineLayout>
    </BlockStack>
  );
}
