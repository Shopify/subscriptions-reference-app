import type {Address} from '@shopify/address';
import type {TextProps} from '@shopify/ui-extensions-react/customer-account';
import {Text} from '@shopify/ui-extensions-react/customer-account';
import {useFormattedAddress} from 'components/Address';

interface InlineAddressProps {
  address: Address;
  appearance: TextProps['appearance'];
}

export function InlineAddress({address, appearance}: InlineAddressProps) {
  const formattedAddress = useFormattedAddress(address);
  const inlineAddress = formattedAddress?.join(', ');

  if (!inlineAddress) {
    return null;
  }

  return <Text appearance={appearance}>{inlineAddress}</Text>;
}
