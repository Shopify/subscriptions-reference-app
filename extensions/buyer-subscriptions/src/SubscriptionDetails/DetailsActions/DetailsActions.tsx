import {Button, Text} from '@shopify/ui-extensions-react/customer-account';
import type {Money, SubscriptionStatus} from 'types';
import {
  PauseSubscriptionModal,
  ResumeSubscriptionModal,
  CancelSubscriptionModal,
} from 'components';
import {useExtensionApi} from 'foundation/Api';
import {SuccessToastType, useToast} from 'utilities/hooks/useToast';

export interface DetailsActionsProps {
  contractId: string;
  status: SubscriptionStatus;
  nextBillingDate?: string;
  lastOrderPrice?: Money | null;
  nextOrderPrice?: Money | null;
  refetchSubscriptionContract: () => void;
}

export function DetailsActions({
  contractId,
  status,
  lastOrderPrice,
  nextOrderPrice,
  refetchSubscriptionContract,
  nextBillingDate,
}: DetailsActionsProps) {
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

  if (status === 'CANCELLED') {
    return null;
  }

  return (
    <>
      {status === 'ACTIVE' ? (
        <Button
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
        overlay={
          <CancelSubscriptionModal
            contractId={contractId}
            onCancelSubscription={onCancelSubscription}
          />
        }
      >
        <Text>{i18n.translate('subscriptionActions.cancel')}</Text>
      </Button>
    </>
  );
}
