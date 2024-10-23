import {useActionData, useLoaderData} from '@remix-run/react';
import {useAppBridge} from '@shopify/app-bridge-react';
import {useEffect, useState} from 'react';

import type {Toast, WithToast} from '~/types';

export function useToasts() {
  const shopify = useAppBridge();
  const loaderData = useLoaderData<WithToast>();
  const actionData = useActionData<WithToast>();
  const [fetcherData, setFetcherData] = useState<WithToast | undefined>(
    undefined,
  );

  useEffect(() => {
    let toast: Toast | undefined = undefined;
    if (fetcherData?.toast) {
      toast = fetcherData.toast;
    } else if (actionData?.toast) {
      toast = actionData.toast;
    } else if (loaderData?.toast) {
      toast = loaderData.toast;
    }

    if (toast) {
      const {message, ...opts} = toast;
      shopify.toast.show(message, opts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcherData, actionData, loaderData]);

  return {showToasts: setFetcherData};
}
