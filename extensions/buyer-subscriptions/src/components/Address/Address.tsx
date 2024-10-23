import {useState, useEffect} from 'react';
import {BlockStack, Text} from '@shopify/ui-extensions-react/customer-account';
import type {Address as AddressType} from '@shopify/address';
import AddressFormatter from '@shopify/address';
import {useExtensionApi} from 'foundation/Api';

export interface AddressProps {
  address: AddressType;
}

export function Address({address}: AddressProps) {
  const formattedAddress = useFormattedAddress(address);

  return formattedAddress ? (
    <BlockStack spacing="none">
      {formattedAddress.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
    </BlockStack>
  ) : null;
}

export function useFormattedAddress(address: AddressType) {
  const {localization} = useExtensionApi();
  const locale = localization.extensionLanguage.current.isoCode;

  const [formattedAddress, setFormattedAddress] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    const addressFormatter = new AddressFormatter(locale);

    async function formatAddress() {
      const formattedAddress = await addressFormatter.format(address);

      if (isMounted) {
        setFormattedAddress(formattedAddress.filter(Boolean));
      }
    }

    formatAddress();

    return () => {
      isMounted = false;
    };
  }, [address, locale]);

  return formattedAddress;
}
