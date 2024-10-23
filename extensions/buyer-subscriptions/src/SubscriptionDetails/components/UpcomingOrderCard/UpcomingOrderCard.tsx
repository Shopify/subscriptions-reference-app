import {
  Heading,
  Card,
  Text,
  Grid,
  BlockStack,
  Button,
  InlineStack,
} from '@shopify/ui-extensions-react/customer-account';
import {isLessThanOneYearAway} from '@shopify/dates';
import type {BillingCycle} from 'types';
import {SkipNextOrderModal, UpcomingOrdersModal} from 'components';
import {getBillingCycleInfo} from 'utilities';
import {useFormatDate} from 'utilities/hooks/useFormatDate';
import {useExtensionApi} from 'foundation/Api';

export interface UpcomingOrderCardProps {
  contractId: string;
  upcomingBillingCycles: BillingCycle[];
  onSkipOrder: () => void;
  refetchSubscriptionContract: () => void;
  refetchLoading: boolean;
}

export function UpcomingOrderCard({
  contractId,
  onSkipOrder,
  upcomingBillingCycles,
  refetchSubscriptionContract,
  refetchLoading,
}: UpcomingOrderCardProps) {
  const {i18n} = useExtensionApi();
  const formatDate = useFormatDate();

  const {
    nextBillingDate,
    canSkipNextBillingCycle,
    cycleIndexToSkip,
    resumeDateIfNextCycleSkipped,
  } = getBillingCycleInfo(upcomingBillingCycles);

  if (!nextBillingDate) return null;

  return (
    <Card padding>
      <BlockStack spacing="base">
        <Grid columns={['3fr', '1fr']}>
          <BlockStack spacing="tight">
            <Heading level={2}>{i18n.translate('upcomingOrder')}</Heading>
            <Text appearance="subdued">{formatDate(nextBillingDate)}</Text>
          </BlockStack>
          <Button
            kind="secondary"
            disabled={!canSkipNextBillingCycle}
            overlay={
              canSkipNextBillingCycle &&
              cycleIndexToSkip &&
              resumeDateIfNextCycleSkipped ? (
                <SkipNextOrderModal
                  contractId={contractId}
                  onSkipOrder={onSkipOrder}
                  cycleIndexToSkip={cycleIndexToSkip}
                  resumeDate={resumeDateIfNextCycleSkipped}
                />
              ) : undefined
            }
          >
            {i18n.translate('skip')}
          </Button>
        </Grid>
        <InlineStack>
          <Button
            kind="plain"
            overlay={
              <UpcomingOrdersModal
                contractId={contractId}
                refetchSubscriptionContract={refetchSubscriptionContract}
                refetchLoading={refetchLoading}
                upcomingBillingCycles={upcomingBillingCycles}
              />
            }
          >
            {i18n.translate('showUpcomingOrders')}
          </Button>
        </InlineStack>
        {canSkipNextBillingCycle ? null : (
          <Text appearance="subdued">
            {isLessThanOneYearAway(new Date(nextBillingDate))
              ? i18n.translate('maxOrdersSkipped')
              : i18n.translate('skipOrderOverYear')}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}
