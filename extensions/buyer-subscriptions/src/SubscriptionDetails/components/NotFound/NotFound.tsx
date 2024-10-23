import {
  Card,
  Text,
  BlockStack,
  Heading,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';
export function NotFound() {
  const {i18n} = useExtensionApi();
  return (
    <Card padding>
      <BlockStack inlineAlignment="center">
        <Heading level={2}>{i18n.translate('notFound.title')}</Heading>
        <Text>{i18n.translate('notFound.description')}</Text>
      </BlockStack>
    </Card>
  );
}
