import type {CountryCode} from 'generatedTypes/customer.types';
import type {Address} from '@shopify/address';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';

import {
  deliveryOptionIsShipping,
  deliveryOptionIsLocalDelivery,
  deliveryOptionIsLocalPickup,
} from '../utilities/helpers';

import SelectDeliveryMethodMutation from '../graphql/SelectDeliveryOptionMutation';

import type {
  SelectDeliveryMethodMutation as SelectDeliveryMethodMutationData,
  SelectDeliveryMethodMutationVariables,
} from 'generatedTypes/customer.generated';
import type {DeliveryOption, UserError} from 'types';

export function useSelectDeliveryOption() {
  const {i18n} = useExtensionApi();
  const [selectDeliveryMethod, {error}] = useGraphqlApi<
    SelectDeliveryMethodMutationData,
    SelectDeliveryMethodMutationVariables
  >();

  async function selectDeliveryOption(
    selectedDeliveryOption: DeliveryOption,
    subscriptionContractId: string,
    token: string,
    address: Address,
    phoneNumber?: string,
    instructions?: string,
  ) {
    const {province, country, phone, ...addressInput} = address;

    const result = await selectDeliveryMethod(SelectDeliveryMethodMutation, {
      token,
      subscriptionContractId,
      deliveryMethod: {
        shipping: deliveryOptionIsShipping(selectedDeliveryOption)
          ? {
              shippingAddress: {
                ...addressInput,
                phoneNumber: phone,
                zoneCode: province,
                territoryCode: country as CountryCode,
              },
            }
          : undefined,
        localDelivery: deliveryOptionIsLocalDelivery(selectedDeliveryOption)
          ? {
              deliveryAddress: {
                ...addressInput,
                phoneNumber: phone,
                zoneCode: province,
                territoryCode: country as CountryCode,
              },
              // there should be a field to enter a phone number
              phone: phoneNumber || '',
              instructions,
            }
          : undefined,
        pickup: deliveryOptionIsLocalPickup(selectedDeliveryOption)
          ? {
              locationId: selectedDeliveryOption.locationId,
            }
          : undefined,
      },
    });

    let errors: UserError[] | undefined;
    if (result?.subscriptionContractSelectDeliveryMethod?.userErrors) {
      errors = result.subscriptionContractSelectDeliveryMethod.userErrors;
    } else if (error) {
      errors = [{message: i18n.translate('addressModal.errorBannerTitle')}];
    }

    return {
      deliveryMethod:
        result?.subscriptionContractSelectDeliveryMethod?.contract
          ?.deliveryMethod,
      errors,
    };
  }

  return selectDeliveryOption;
}
