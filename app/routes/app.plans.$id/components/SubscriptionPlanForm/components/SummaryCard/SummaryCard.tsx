import {BlockStack, Card, List, Text} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {useFormContext} from '@rvf/remix';
import {DeliverySummary, ProductSummary} from './components';

export function SummaryCard() {
  const {t} = useTranslation('app.plans.details');
  const form = useFormContext<{merchantCode: string}>();

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('summaryCard.cardTitle')}
        </Text>
        <BlockStack gap="100">
          <Text variant="headingMd" as="h3" breakWord>
            {form.value('merchantCode') || t('summaryCard.noPlanTitleYet')}
          </Text>
          <List type="bullet">
            <DeliverySummary />
            <ProductSummary />
          </List>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
