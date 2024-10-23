import {BlockStack, Box, Card, InlineStack, Text} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import type {Money} from '~/types';
import type {SubscriptionDeliveryMethod} from '~/types/contracts';
import {getDeliveryMethodTitle} from '~/utils/getDeliveryMethodInfo';
import {formatPrice} from '~/utils/helpers/money';

export interface PaymentSummaryCardProps {
  subtotal?: Money;
  total?: Money;
  totalTax?: Money;
  totalShipping?: Money;
  deliveryMethod?: SubscriptionDeliveryMethod;
}

export function PaymentSummaryCard({
  subtotal,
  total,
  totalTax,
  totalShipping,
  deliveryMethod,
}: PaymentSummaryCardProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;

  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd" fontWeight="semibold">
          {t('edit.details.paymentSummary')}
        </Text>

        <Box
          padding="300"
          borderColor="border"
          borderWidth="025"
          borderRadius="200"
        >
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd">
                {t('edit.details.subtotal')}
              </Text>
              <Text as="p" variant="bodyMd">
                {formatPrice({
                  amount: subtotal?.amount,
                  currency: subtotal?.currencyCode,
                  locale,
                })}
              </Text>
            </InlineStack>
            {deliveryMethod && !deliveryMethod.isLocalPickup ? (
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400">
                  <Text as="p" variant="bodyMd">
                    {t('edit.details.shipping')}
                  </Text>
                  <Text as="h1" tone="subdued">
                    {getDeliveryMethodTitle(deliveryMethod)}
                  </Text>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  {formatPrice({
                    amount: totalShipping?.amount,
                    currency: totalShipping?.currencyCode,
                    locale,
                  })}
                </Text>
              </InlineStack>
            ) : null}
            {totalTax ? (
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  {t('edit.details.tax')}
                </Text>
                <Text as="p" variant="bodyMd">
                  {formatPrice({
                    amount: totalTax?.amount,
                    currency: totalTax?.currencyCode,
                    locale,
                  })}
                </Text>
              </InlineStack>
            ) : null}
            {total ? (
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  {t('edit.details.total')}
                </Text>
                <Text as="p" variant="bodyMd">
                  {formatPrice({
                    amount: total?.amount,
                    currency: total?.currencyCode,
                    locale,
                  })}
                </Text>
              </InlineStack>
            ) : null}
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  );
}
