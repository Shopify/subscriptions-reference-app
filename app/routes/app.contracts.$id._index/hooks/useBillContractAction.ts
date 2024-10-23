import {useFetcher, useRevalidator} from '@remix-run/react';
import {useCallback, useEffect, useState} from 'react';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';
import {usePollBillingAttemptAction} from '~/routes/app.contracts.$id._index/hooks/usePollBillingAttemptAction';

export function useBillContractAction() {
  const fetcher = useFetcher<WithToast<{id?: string}>>();
  const {showToasts} = useToasts();
  const [isAttemptInProgress, setIsAttemptInProgress] = useState(false);
  const revalidator = useRevalidator();

  const onDonePollingAttempt = useCallback(() => {
    setIsAttemptInProgress(false);
    revalidator.revalidate();
  }, [revalidator]);

  const startPolling = usePollBillingAttemptAction({
    onDoneCallback: onDonePollingAttempt,
  });

  const billContractLoading =
    fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (!billContractLoading) {
      showToasts(fetcher.data);
      if (fetcher.data?.id) {
        startPolling(fetcher.data?.id);
      } else {
        setIsAttemptInProgress(false);
      }
    }
  }, [fetcher.data, billContractLoading, showToasts, startPolling]);

  const billContract = useCallback(
    (cycleIndex: number, allowOverselling: boolean = false) => {
      setIsAttemptInProgress(true);
      const inventoryPolicy = allowOverselling
        ? 'ALLOW_OVERSELLING'
        : 'PRODUCT_VARIANT_INVENTORY_POLICY';
      const formData = new FormData();
      formData.append('inventoryPolicy', inventoryPolicy);
      formData.append('cycleIndex', cycleIndex.toString());
      fetcher.submit(formData, {method: 'post', action: `./bill-contract`});
    },
    [fetcher],
  );

  return {
    billContract,
    billContractLoading,
    isAttemptInProgress,
  };
}
