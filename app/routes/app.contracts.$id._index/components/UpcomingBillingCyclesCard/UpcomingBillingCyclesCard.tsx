import {
  Badge,
  BlockStack,
  Card,
  Divider,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';

import {Link} from '@remix-run/react';
import {SubscriptionContractStatus} from '~/types';
import type {
  FailedBillingCycle,
  SubscriptionContractStatusType,
  UpcomingBillingCycle,
} from '~/types';
import {NUM_BILLING_CYCLES_TO_SHOW} from '~/utils/constants';
import {useFormatDate} from '~/utils/helpers/date';
import {SkipBillingCycleForm} from './components/SkipBillingCycleForm/SkipBillingCycleForm';
import {AlertCircleIcon} from '@shopify/polaris-icons';

interface Props {
  contractStatus: SubscriptionContractStatusType;
  upcomingBillingCycles: UpcomingBillingCycle[];
  hasMoreBillingCycles: boolean;
  failedBillingCycle?: FailedBillingCycle;
}

export function UpcomingBillingCyclesCard({
  contractStatus,
  upcomingBillingCycles,
  hasMoreBillingCycles,
  failedBillingCycle,
}: Props) {
  const {t, i18n} = useTranslation('app.contracts');
  const showSkipForm = contractStatus !== SubscriptionContractStatus.Paused;
  const billingCyclesCount = upcomingBillingCycles.length;
  const formatDate = useFormatDate();

  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd" fontWeight="semibold">
          {t('details.upcomingOrders')}
        </Text>
        <div>
          <BlockStack gap="200">
            <BlockStack gap="200">
              {upcomingBillingCycles.map(
                ({billingAttemptExpectedDate, skipped, cycleIndex}, index) => {
                  return (
                    <BlockStack key={billingAttemptExpectedDate} gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200">
                          <Text as="span" variant="bodyMd">
                            {formatDate(
                              billingAttemptExpectedDate,
                              i18n.language,
                            )}
                          </Text>
                          {skipped && (
                            <Badge>{t('details.nextOrders.skipped')}</Badge>
                          )}
                          {failedBillingCycle?.cycleIndex == cycleIndex ? (
                            <InlineStack wrap={false}>
                              <Icon source={AlertCircleIcon} tone="warning" />
                              <Text as="span" variant="bodyMd" tone="subdued">
                                {t('details.orderNotCreated')}
                              </Text>
                            </InlineStack>
                          ) : null}
                        </InlineStack>
                        {showSkipForm ? (
                          <SkipBillingCycleForm
                            cycleIndex={cycleIndex}
                            skipped={skipped}
                          />
                        ) : null}
                      </InlineStack>
                      {index === upcomingBillingCycles.length - 1 &&
                      !hasMoreBillingCycles ? null : (
                        <Divider />
                      )}
                    </BlockStack>
                  );
                },
              )}
            </BlockStack>
            {hasMoreBillingCycles ? (
              <div>
                <Link
                  relative="path"
                  to={`?billingCycles=${
                    billingCyclesCount + NUM_BILLING_CYCLES_TO_SHOW
                  }`}
                  preventScrollReset
                >
                  {t('details.nextOrders.showMoreNoCount')}
                </Link>
              </div>
            ) : null}
          </BlockStack>
        </div>
      </BlockStack>
    </Card>
  );
}
