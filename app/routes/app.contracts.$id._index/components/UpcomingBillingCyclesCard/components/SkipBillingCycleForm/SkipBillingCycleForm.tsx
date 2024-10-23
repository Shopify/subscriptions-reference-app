import {useFetcher} from '@remix-run/react';
import {Button} from '@shopify/polaris';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';
import {SkipOrResume} from '~/utils/constants';

interface SkipBillingCycleFormProps {
  cycleIndex: number;
  skipped: boolean;
}

export function SkipBillingCycleForm({
  cycleIndex,
  skipped,
}: SkipBillingCycleFormProps) {
  const {t} = useTranslation('app.contracts');
  const fetcher = useFetcher<WithToast>();
  const {showToasts} = useToasts();

  const loading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (!fetcher.data || loading) return;

    showToasts(fetcher.data);
  }, [fetcher.data, loading, showToasts]);

  return (
    <fetcher.Form method="post" action={`./billing-cycle-skip`}>
      <input hidden readOnly name="billingCycleIndex" value={cycleIndex} />
      <input
        hidden
        readOnly
        name="skip"
        value={skipped ? SkipOrResume.Resume : SkipOrResume.Skip}
      />
      <Button submit variant="plain" loading={loading}>
        {skipped
          ? t('details.nextOrders.resume')
          : t('details.nextOrders.skip')}
      </Button>
    </fetcher.Form>
  );
}
