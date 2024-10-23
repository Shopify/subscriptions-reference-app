import {useFetcher} from '@remix-run/react';
import {Box} from '@shopify/polaris';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';
interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CancelSubscriptionModal({
  open,
  onClose,
}: CancelSubscriptionModalProps) {
  const {t} = useTranslation('app.contracts');
  const fetcher = useFetcher<WithToast<{error?: boolean}>>();
  const {showToasts} = useToasts();
  const loading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  useEffect(() => {
    if (!loading) {
      showToasts(fetcher.data);

      if (!fetcher.data?.error) {
        onClose();
      }
    }
  }, [fetcher.data, loading, onClose, showToasts]);

  function cancelSubscription() {
    fetcher.submit({}, {method: 'post', action: `./cancel`});
  }

  return (
    <Modal open={open} onHide={onClose}>
      <Box padding="400">
        <p>{t('actions.cancel.modalContent')}</p>
      </Box>
      <TitleBar title={t('actions.cancel.modalTitle')}>
        <button onClick={onClose}>{t('actions.cancel.modalCancel')}</button>
        <button
          variant="primary"
          tone="critical"
          loading={loading ? 'true' : undefined}
          onClick={cancelSubscription}
        >
          {t('actions.cancel.modalTitle')}
        </button>
      </TitleBar>
    </Modal>
  );
}
