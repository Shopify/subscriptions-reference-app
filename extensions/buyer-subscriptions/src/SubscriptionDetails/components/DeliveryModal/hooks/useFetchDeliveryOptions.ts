import type {Address} from '@shopify/address';
import {useGraphqlApi, useExtensionApi} from 'foundation/Api';
import {delay} from 'utilities';
import type {CountryCode} from 'generatedTypes/customer.types';
import type {
  DeliveryOption,
  DeliveryOptionsResult,
  DeliveryOptionsResultFailure,
  DeliveryOptionsResultSuccess,
  UserError,
} from 'types';

import FetchDeliveryOptionsMutation from '../graphql/FetchDeliveryOptionsMutation';

import type {
  FetchDeliveryOptionsMutation as FetchDeliveryOptionsMutationData,
  FetchDeliveryOptionsMutationVariables,
} from 'generatedTypes/customer.generated';

const MAX_POLLS = 20;
const POLL_DELAY_MS = 1000;

function deliveryOptionsIsSuccess(
  deliveryOptions: DeliveryOptionsResult,
): deliveryOptions is DeliveryOptionsResultSuccess {
  return 'deliveryOptions' in deliveryOptions;
}

function deliveryOptionsIsFailure(
  deliveryOptions: DeliveryOptionsResult,
): deliveryOptions is DeliveryOptionsResultFailure {
  return !('deliveryOptions' in deliveryOptions);
}

export function useFetchDeliveryOptions() {
  const {i18n} = useExtensionApi();

  const [fetchDeliveryOptions] = useGraphqlApi<
    FetchDeliveryOptionsMutationData,
    FetchDeliveryOptionsMutationVariables
  >();

  async function getDeliveryOptions(
    shippingAddress: Address,
    subscriptionContractId: string,
  ): Promise<{
    deliveryOptions: DeliveryOption[];
    deliveryOptionsToken?: string;
    errors: UserError[];
  }> {
    const {country, province, phone, ...restOfAddress} = shippingAddress;

    const noDeliveryOptionsFound = {
      deliveryOptions: [],
      errors: [
        {
          message: i18n.translate('addressModal.noDeliveryOptions'),
        },
      ],
    };

    for (let i = 0; i < MAX_POLLS; i++) {
      const deliveryOptionsResponse = await fetchDeliveryOptions(
        FetchDeliveryOptionsMutation,
        {
          deliveryAddress: {
            ...restOfAddress,
            territoryCode: country as CountryCode,
            zoneCode: province,
            phoneNumber: phone,
          },
          subscriptionContractId,
        },
      );

      const userErorrs =
        deliveryOptionsResponse?.subscriptionContractFetchDeliveryOptions
          ?.userErrors;

      if (userErorrs && userErorrs.length > 0) {
        return {
          deliveryOptions: [],
          errors: userErorrs,
        };
      }

      const deliveryOptionsResult: DeliveryOptionsResult | null | undefined =
        deliveryOptionsResponse?.subscriptionContractFetchDeliveryOptions
          ?.deliveryOptionsResult;

      if (
        deliveryOptionsResult &&
        deliveryOptionsIsSuccess(deliveryOptionsResult)
      ) {
        return {
          deliveryOptions: deliveryOptionsResult.deliveryOptions,
          deliveryOptionsToken: deliveryOptionsResult.token,
          errors: [],
        };
      }

      if (
        deliveryOptionsResult &&
        deliveryOptionsIsFailure(deliveryOptionsResult)
      ) {
        // We want to show the same message as checkout when there are no delivery options
        // -> Do not return the mutation failure message as a user error
        return noDeliveryOptionsFound;
      }

      await delay(POLL_DELAY_MS);
    }

    return noDeliveryOptionsFound;
  }

  return getDeliveryOptions;
}
