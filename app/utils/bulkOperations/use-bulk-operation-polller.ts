import {useFetcher, useRevalidator} from '@remix-run/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {type CurrentBulkOperation} from './bulkOperations';
import {useAppBridge} from '@shopify/app-bridge-react';
import {useTranslation} from 'react-i18next';

export const MAX_ATTEMPTS = 10;

export function useBulkOperationPoller() {
  const fetcher = useFetcher<CurrentBulkOperation | null>();
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const {t} = useTranslation('common');

  const pollBulkOperation = useCallback(() => {
    intervalIdRef.current = setInterval(() => {
      if (intervalIdRef.current) {
        fetcher.load('/app/bulk-operation');
        setAttemptsCount((prev) => prev + 1);
      }
    }, 1000);
  }, [fetcher]);

  useEffect(() => {
    if (
      fetcher.data !== undefined &&
      fetcher.data?.status !== 'RUNNING' &&
      intervalIdRef.current
    ) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      revalidator.revalidate();
      shopify.toast.show(t('bulkOperation.bulkOperationCompleted'));
    }

    if (attemptsCount >= MAX_ATTEMPTS && intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, [fetcher.data, attemptsCount, revalidator, shopify, t]);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    };
  }, []);

  return {
    pollBulkOperation,
  };
}
