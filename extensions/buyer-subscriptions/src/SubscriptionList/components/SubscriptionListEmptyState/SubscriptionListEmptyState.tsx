import {
  Card,
  Text,
  BlockStack,
  Heading,
  Page,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';

export function SubscriptionListEmptyState() {
  const {i18n} = useExtensionApi();

  return (
    <Page title={i18n.translate('subscriptions')}>
      <Card padding>
        <BlockStack inlineAlignment="center">
          <Heading level={2}>{i18n.translate('emptyState.title')}</Heading>
          <Text>{i18n.translate('emptyState.description')}</Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
