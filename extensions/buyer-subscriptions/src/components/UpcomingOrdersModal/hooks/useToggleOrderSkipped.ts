import {useState, useEffect} from 'react';
import {useFormatDate} from 'utilities/hooks/useFormatDate';

import SkipOrderMutation from '../graphql/SkipOrderMutation';
import UnskipOrderMutation from '../graphql/UnskipOrderMutation';

import type {
  SkipOrderMutation as SkipOrderMutationData,
  SkipOrderMutationVariables,
  UnskipOrderMutation as UnskipOrderMutationData,
  UnskipOrderMutationVariables,
} from 'generatedTypes/customer.generated';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';

enum BannerStatus {
  Success = 'success',
  Critical = 'critical',
}

export function useToggleSkipOrder({
  contractId,
  refetchSubscriptionContract,
  refetchLoading,
}: {
  contractId: string;
  refetchSubscriptionContract: () => void;
  refetchLoading: boolean;
}) {
  const {
    i18n,
    ui: {
      toast: {show: showToast},
    },
  } = useExtensionApi();
  const [bannerText, setBannerText] = useState<string | null>(null);
  const [bannerStatus, setBannerStatus] = useState<BannerStatus | null>(null);
  const [cycleIndexLoading, setCycleIndexLoading] = useState<number | null>(
    null,
  );

  const [skipOrder] = useGraphqlApi<
    SkipOrderMutationData,
    SkipOrderMutationVariables
  >();

  const [unskipOrder] = useGraphqlApi<
    UnskipOrderMutationData,
    UnskipOrderMutationVariables
  >();

  const formatDate = useFormatDate();

  useEffect(() => {
    if (!refetchLoading) {
      setCycleIndexLoading(null);
    }
  }, [refetchLoading]);

  async function handleSkiporder(billingCycleIndex: number) {
    setCycleIndexLoading(billingCycleIndex);
    const result = await skipOrder(SkipOrderMutation, {
      subscriptionContractId: contractId,
      billingCycleIndex,
    });

    if (!result?.subscriptionBillingCycleSkip?.billingCycle?.skipped) {
      setBannerText(i18n.translate('upcomingOrdersModal.skippedErrorMessage'));
      setBannerStatus(BannerStatus.Critical);
      setCycleIndexLoading(null);
      return;
    }

    showToast(
      i18n.translate('upcomingOrdersModal.skippedSuccessMessage', {
        orderDate: formatDate(
          result.subscriptionBillingCycleSkip.billingCycle
            .billingAttemptExpectedDate,
        ),
      }),
    );

    refetchSubscriptionContract();
  }

  async function handleUnskipOrder(billingCycleIndex: number) {
    setCycleIndexLoading(billingCycleIndex);
    const result = await unskipOrder(UnskipOrderMutation, {
      subscriptionContractId: contractId,
      billingCycleIndex,
    });

    if (
      !result?.subscriptionBillingCycleUnskip?.billingCycle ||
      result.subscriptionBillingCycleUnskip.billingCycle.skipped
    ) {
      setBannerText(
        i18n.translate('upcomingOrdersModal.unskippedErrorMessage'),
      );
      setBannerStatus(BannerStatus.Critical);
      setCycleIndexLoading(null);
      return;
    }

    showToast(
      i18n.translate('upcomingOrdersModal.unskippedSuccessMessage', {
        orderDate: formatDate(
          result.subscriptionBillingCycleUnskip.billingCycle
            .billingAttemptExpectedDate,
        ),
      }),
    );

    refetchSubscriptionContract();
  }

  function toggleSkipOrder(billingCycleIndex: number, skipped: boolean) {
    if (skipped) {
      handleUnskipOrder(billingCycleIndex);
    } else {
      handleSkiporder(billingCycleIndex);
    }
  }

  function onCloseModal() {
    setBannerText(null);
    setBannerStatus(null);
  }

  return {
    bannerStatus,
    bannerText,
    cycleIndexLoading,
    toggleSkipOrder,
    onCloseModal,
  };
}
