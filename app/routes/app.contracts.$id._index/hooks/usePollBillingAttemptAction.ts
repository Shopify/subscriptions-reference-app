import {useFetcher} from '@remix-run/react';
import {useCallback, useEffect, useRef, useState} from 'react';

interface PollBillingAttemptParams {
  onDoneCallback: () => void;
}

export function usePollBillingAttemptAction({
  onDoneCallback,
}: PollBillingAttemptParams) {
  const fetcher = useFetcher<{
    ready: boolean;
    id?: string;
  }>();
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const [billingAttemptId, setBillingAttemptId] = useState<string | null>(null);

  const billAttemptLoading =
    fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (billAttemptLoading) {
      return;
    }

    const isDone = fetcher.data?.ready && fetcher.data?.id === billingAttemptId;
    if (isDone && intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
      onDoneCallback();
    }
  }, [billAttemptLoading, billingAttemptId, fetcher.data, onDoneCallback]);

  useEffect(() => {
    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = null;
    };
  }, []);

  return useCallback(
    (id: string) => {
      if (billingAttemptId === id) return;

      setBillingAttemptId(id);
      intervalId.current = setInterval(async () => {
        const formData = new FormData();
        formData.append('billingAttemptId', id);
        fetcher.submit(formData, {
          method: 'POST',
          action: `./poll-bill-attempt`,
        });
      }, 1000);
    },
    [billingAttemptId, fetcher],
  );
}
