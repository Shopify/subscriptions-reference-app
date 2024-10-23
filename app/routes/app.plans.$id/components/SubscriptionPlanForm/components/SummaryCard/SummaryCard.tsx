import {BlockStack, Card, List, Text} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {useControlField} from 'remix-validated-form';
import type {Product} from '~/types';
import {DeliverySummary, ProductSummary} from './components';

interface SummaryCardProps {
  selectedProducts: Product[];
}

export function SummaryCard({selectedProducts}: SummaryCardProps) {
  const {t} = useTranslation('app.plans.details');
  const [merchantCode] = useControlField<string>('merchantCode');

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('summaryCard.cardTitle')}
        </Text>
        <BlockStack gap="100">
          <Text variant="headingMd" as="h3" breakWord>
            {merchantCode || t('summaryCard.noPlanTitleYet')}
          </Text>
          <List type="bullet">
            <DeliverySummary />
            <ProductSummary selectedProducts={selectedProducts} />
          </List>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
