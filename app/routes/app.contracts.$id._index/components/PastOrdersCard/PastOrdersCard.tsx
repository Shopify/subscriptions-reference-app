import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  Badge,
  BlockStack,
  Card,
  Divider,
  Icon,
  InlineStack,
  Link,
  Text,
} from '@shopify/polaris';
import {AlertCircleIcon} from '@shopify/polaris-icons';
import {useTranslation} from 'react-i18next';
import type {PastBillingCycle} from '~/types';
import {useFormatDate} from '~/utils/helpers/date';

interface PastOrdersCardProps {
  pastBillingCycles: PastBillingCycle[];
}

export function PastOrdersCard({pastBillingCycles}: PastOrdersCardProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const formatDate = useFormatDate();

  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd" fontWeight="semibold">
          {t('details.pastOrders')}
        </Text>
        {/* show the least recent orders at the top of the card */}
        {pastBillingCycles.map(
          ({cycleIndex, skipped, order, billingAttemptExpectedDate}, index) => (
            <BlockStack key={cycleIndex} gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200">
                  <Text
                    as="span"
                    variant="bodyMd"
                    tone={skipped ? 'subdued' : undefined}
                  >
                    {formatDate(billingAttemptExpectedDate, i18n.language)}
                  </Text>
                  {skipped && <Badge>{t('details.nextOrders.skipped')}</Badge>}
                </InlineStack>
                {order ? (
                  <Link
                    removeUnderline
                    url={`shopify://admin/orders/${parseGid(order.id)}`}
                  >
                    {t('details.viewOrder')}
                  </Link>
                ) : (
                  <InlineStack wrap={false}>
                    <Icon source={AlertCircleIcon} tone="warning" />
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {t('details.orderNotCreated')}
                    </Text>
                  </InlineStack>
                )}
              </InlineStack>
              {index === pastBillingCycles.length - 1 ? null : <Divider />}
            </BlockStack>
          ),
        )}
      </BlockStack>
    </Card>
  );
}
