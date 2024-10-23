import {
  Heading,
  Card,
  Grid,
  Text,
  BlockStack,
  InlineStack,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';
import type {Money} from 'types';

export interface PriceSummaryCardProps {
  price: {
    subtotalPrice: Money;
    totalTax: Money;
    totalShippingPrice: Money;
    totalPrice: Money;
  };
}

export function PriceSummaryCard({price}: PriceSummaryCardProps) {
  const {i18n} = useExtensionApi();
  return (
    <Card padding>
      <BlockStack spacing="loose">
        <Heading level={2}>{i18n.translate('priceSummary.text')}</Heading>
        <BlockStack spacing="tight">
          <Grid columns={['fill', 'auto']}>
            <Text>{i18n.translate('priceSummary.subtotal')}</Text>
            <Text>
              {i18n.formatCurrency(Number(price.subtotalPrice.amount), {
                currency: price.subtotalPrice.currencyCode,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </Grid>
          <Grid columns={['fill', 'auto']}>
            <Text>{i18n.translate('priceSummary.shipping')}</Text>
            <Text>
              {i18n.formatCurrency(Number(price.totalShippingPrice.amount), {
                currency: price.totalShippingPrice.currencyCode,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </Grid>
          <Grid columns={['fill', 'auto']}>
            <Text>{i18n.translate('priceSummary.taxes')}</Text>
            <Text>
              {i18n.formatCurrency(Number(price.totalTax.amount), {
                currency: price.totalTax.currencyCode,
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </Grid>
        </BlockStack>
        <Grid columns={['fill', 'auto']}>
          <Text emphasis="bold" size="large">
            {i18n.translate('priceSummary.total')}
          </Text>
          <InlineStack blockAlignment="baseline" spacing="extraTight">
            <Text size="small" appearance="subdued">
              {price.totalPrice.currencyCode}
            </Text>
            <Text emphasis="bold" size="large">
              {i18n.formatCurrency(Number(price.totalPrice.amount), {
                currency: price.totalPrice.currencyCode,
                compactDisplay: 'short',
                currencyDisplay: 'narrowSymbol',
              })}
            </Text>
          </InlineStack>
        </Grid>
      </BlockStack>
    </Card>
  );
}
