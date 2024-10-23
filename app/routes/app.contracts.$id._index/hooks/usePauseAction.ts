import {useFetcher} from '@remix-run/react';
import {useEffect} from 'react';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';

export function usePauseAction() {
  const fetcher = useFetcher<WithToast>();
  const {showToasts} = useToasts();

  const pauseLoading =
    fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (!pauseLoading) {
      showToasts(fetcher.data);
    }
  }, [fetcher.data, pauseLoading, showToasts]);

  const pauseContract = async () => {
    fetcher.submit(new FormData(), {method: 'post', action: `./pause`});
  };

  return {
    pauseContract,
    pauseLoading,
  };
}
