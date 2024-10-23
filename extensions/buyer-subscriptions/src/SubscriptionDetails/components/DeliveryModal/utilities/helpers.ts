import type {Address, Country} from '@shopify/address';
import {FieldName} from '@shopify/address';
import {PhoneNumberFormat, PhoneNumberUtil} from 'google-libphonenumber';
import type {CountryCode} from 'generatedTypes/customer.types';
import type {
  DeliveryOption,
  ShippingOption,
  PickupOption,
  LocalDeliveryOption,
} from 'types';

interface FormError {
  field?: string[] | null;
  message: string;
}

export interface FormattedPhoneNumber {
  inputPhoneNumber: string;
  inputRegionCode: string | undefined;

  forcedFormattedPhoneNumber: string | undefined;
  detectedRegionCode: string | undefined;
  isValid: boolean;
  formattedPhoneNumber: string;
  countryCodeForRegion?: number;
}

export function getCountry(
  countries: Country[],
  countryCode: string,
  shopCountry: string,
  currentLocationCountry?: string,
) {
  return (
    countries.find(({code}) => code === countryCode) ||
    (currentLocationCountry &&
      countries.find(({code}) => code === currentLocationCountry)) ||
    countries.find(({code}) => code === shopCountry) ||
    countries[0]
  );
}

export function formatUserErrorsForFields(submitErrors: FormError[]) {
  const errors: {[key in FieldName]?: string} = {};
  const addressFieldNames = Object.values<string>(FieldName);
  submitErrors.forEach((userError) => {
    if (userError.field && userError.field.length > 0) {
      const field = userError.field[0];
      if (field === 'zoneCode') {
        errors.province = userError.message;
      } else if (field === 'countryCode') {
        errors.country = userError.message;
      } else if (addressFieldNames.includes(field)) {
        errors[field as FieldName] = userError.message;
      }
    }
  });

  return errors;
}

export function formatPhoneNumber(
  rawPhoneNumber: string,
  regionCode?: string,
): FormattedPhoneNumber {
  const detectedRegionCode = getRegionCode(rawPhoneNumber);
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    const parsedPhoneNumber = phoneUtil.parseAndKeepRawInput(
      rawPhoneNumber,
      regionCode,
    );
    const formatted = phoneUtil.format(
      parsedPhoneNumber,
      PhoneNumberFormat.INTERNATIONAL,
    );
    const isValid = phoneUtil.isValidNumber(parsedPhoneNumber);
    return {
      inputPhoneNumber: rawPhoneNumber,
      inputRegionCode: regionCode,
      forcedFormattedPhoneNumber: formatted,
      detectedRegionCode,
      isValid,
      formattedPhoneNumber: isValid ? formatted : rawPhoneNumber,
    };
  } catch {
    return {
      inputPhoneNumber: rawPhoneNumber,
      inputRegionCode: regionCode,
      forcedFormattedPhoneNumber: undefined,
      detectedRegionCode,
      isValid: false,
      formattedPhoneNumber: rawPhoneNumber,
    };
  }
}

export function getCountryCodeForRegion(
  regionCode: string,
): number | undefined {
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    const countryCode = phoneUtil.getCountryCodeForRegion(regionCode);
    return countryCode;
  } catch {
    return undefined;
  }
}

function getRegionCode(rawPhoneNumber: string): string | undefined {
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    const parsedPhoneNumber = phoneUtil.parseAndKeepRawInput(rawPhoneNumber);
    const region = phoneUtil.getRegionCodeForNumber(parsedPhoneNumber);
    // Note: Though type annotations seem to show that getRegionCodeForNumber returns string | undefined, it actually returns string | null
    return region ?? undefined;
  } catch {
    return undefined;
  }
}

export function deliveryOptionIsShipping(
  deliveryOption: DeliveryOption,
): deliveryOption is ShippingOption {
  return deliveryOption.__typename === 'SubscriptionShippingOption';
}

export function deliveryOptionIsLocalDelivery(
  deliveryOption: DeliveryOption,
): deliveryOption is LocalDeliveryOption {
  return deliveryOption.__typename === 'SubscriptionLocalDeliveryOption';
}

export function deliveryOptionIsLocalPickup(
  deliveryOption: DeliveryOption,
): deliveryOption is PickupOption {
  return deliveryOption.__typename === 'SubscriptionPickupOption';
}

export function createBlankAddress(country: CountryCode): Address {
  return {
    address1: '',
    address2: '',
    city: '',
    zip: '',
    country,
  };
}
