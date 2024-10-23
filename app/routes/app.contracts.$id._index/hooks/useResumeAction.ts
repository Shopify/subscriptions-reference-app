import {useFetcher} from '@remix-run/react';
import {useEffect} from 'react';
import {useToasts} from '~/hooks';
import type {ResponseWithToast} from '~/types';

export const useResumeAction = () => {
  const fetcher = useFetcher<ResponseWithToast>();
  const {showToasts} = useToasts();

  const resumeLoading =
    fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (!resumeLoading) {
      showToasts(fetcher.data);
    }
  }, [fetcher.data, resumeLoading, showToasts]);

  const resumeContract = async () => {
    fetcher.submit({}, {method: 'post', action: './resume'});
  };

  return {
    resumeContract,
    resumeLoading,
  };
};
