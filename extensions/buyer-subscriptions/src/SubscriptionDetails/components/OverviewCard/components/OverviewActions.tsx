import {
  Button,
  Text,
  Style,
  Grid,
} from '@shopify/ui-extensions-react/customer-account';
import type {Money, SubscriptionStatus} from 'types';
import {
  PauseSubscriptionModal,
  ResumeSubscriptionModal,
  CancelSubscriptionModal,
} from 'components';
import {useExtensionApi} from 'foundation/Api';
import {SuccessToastType, useToast} from 'utilities/hooks/useToast';

export interface OverviewActionsProps {
  contractId: string;
  status: SubscriptionStatus;
  nextBillingDate?: string;
  lastOrderPrice?: Money | null;
  nextOrderPrice?: Money | null;
  refetchSubscriptionContract: () => void;
}

export function OverviewActions({
  contractId,
  status,
  lastOrderPrice,
  nextOrderPrice,
  refetchSubscriptionContract,
  nextBillingDate,
}: OverviewActionsProps) {
  const {i18n} = useExtensionApi();
  const {showSuccessToast} = useToast();

  function onPauseSubscription() {
    refetchSubscriptionContract();
    showSuccessToast(SuccessToastType.Paused);
  }

  function onResumeSubscription() {
    refetchSubscriptionContract();
    showSuccessToast(SuccessToastType.Resumed);
  }

  function onCancelSubscription() {
    refetchSubscriptionContract();
    showSuccessToast(SuccessToastType.Cancelled);
  }

  return (
    <Grid
      columns={Style.default(['fill']).when(
        {viewportInlineSize: {min: 'small'}},
        ['auto', 'auto', 'fill'],
      )}
      rows={Style.default(['auto', 'auto']).when(
        {viewportInlineSize: {min: 'small'}},
        ['auto'],
      )}
      spacing="loose"
    >
      {status === 'ACTIVE' ? (
        <Button
          kind="secondary"
          overlay={
            <PauseSubscriptionModal
              contractId={contractId}
              onPauseSubscription={onPauseSubscription}
            />
          }
        >
          <Text>{i18n.translate('subscriptionActions.pause')}</Text>
        </Button>
      ) : null}
      {status === 'PAUSED' ? (
        <Button
          kind="secondary"
          overlay={
            <ResumeSubscriptionModal
              contractId={contractId}
              resumeDate={nextBillingDate}
              lastOrderPrice={lastOrderPrice}
              nextOrderPrice={nextOrderPrice}
              onResumeSubscription={onResumeSubscription}
            />
          }
        >
          <Text>{i18n.translate('subscriptionActions.resume')}</Text>
        </Button>
      ) : null}
      <Button
        appearance="critical"
        kind="secondary"
        overlay={
          <CancelSubscriptionModal
            contractId={contractId}
            onCancelSubscription={onCancelSubscription}
          />
        }
      >
        <Text>{i18n.translate('subscriptionActions.cancel')}</Text>
      </Button>
    </Grid>
  );
}
