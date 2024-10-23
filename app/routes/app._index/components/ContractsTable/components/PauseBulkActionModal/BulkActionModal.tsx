import {useFetcher} from '@remix-run/react';
import {Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';
import {Box} from '@shopify/polaris';
import {useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import type {WithToast} from '~/types';
import {useBulkOperationPoller} from '~/utils/bulkOperations/use-bulk-operation-polller';
import {getTranslationKeyFromAction} from '~/utils/helpers/getTranslationKeyFromAction';

export interface BulkActionModalProps {
  selectedResources: string[];
  open: boolean;
  action: string;
  closeModal: () => void;
}

export function BulkActionModal({
  selectedResources,
  open,
  action,
  closeModal,
}: BulkActionModalProps) {
  const {t} = useTranslation('app.contracts');
  const shopify = useAppBridge();
  const {pollBulkOperation} = useBulkOperationPoller();
  const translationKey = getTranslationKeyFromAction(action);

  const fetcher = useFetcher<WithToast<{bulkOperationId: string}>>();
  const loading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const handledBulkOperationId = useRef<string | null>(null);
  const currentBulkOperationHandled =
    fetcher.data?.bulkOperationId === handledBulkOperationId.current;

  useEffect(() => {
    if (!loading && fetcher.data) {
      const toast = fetcher.data.toast;
      if (toast && !currentBulkOperationHandled) {
        shopify.toast.show(toast.message, {
          isError: Boolean(toast.isError),
        });

        if (!toast.isError) {
          pollBulkOperation();
          closeModal();
        }
        handledBulkOperationId.current = fetcher.data.bulkOperationId;
      }
    }
  }, [
    fetcher.data,
    loading,
    closeModal,
    shopify,
    pollBulkOperation,
    currentBulkOperationHandled,
  ]);

  const runAction = async () => {
    fetcher.submit(
      {
        contracts: selectedResources.join(','),
        action,
      },
      {method: 'post', action: `/app/contracts/bulk-operation`},
    );
  };

  return (
    <Modal open={open} onHide={closeModal}>
      <Box padding="400">
        <p>{t(`${translationKey}.content`)}</p>
      </Box>
      <TitleBar
        title={t(`${translationKey}.title`, {
          count: selectedResources.length,
        })}
      >
        <button onClick={closeModal}>{t(`${translationKey}.cancel`)}</button>
        <button
          tone={action == 'bulk-cancel' ? 'critical' : undefined}
          variant="primary"
          onClick={runAction}
          loading={loading ? '' : undefined}
        >
          {t(`${translationKey}.action`, {count: selectedResources.length})}
        </button>
      </TitleBar>
    </Modal>
  );
}
