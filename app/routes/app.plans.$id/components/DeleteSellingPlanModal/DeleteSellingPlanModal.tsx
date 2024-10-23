import {useFetcher} from '@remix-run/react';
import {Box, Text} from '@shopify/polaris';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import type {WithToast} from '~/types';
import {useToasts} from '~/hooks';

interface DeleteSellingPlanGropuModalProps {
  open: boolean;
  onClose: () => void;
  sellingPlanGroupName: string;
}

export default function DeleteSellingPlanGroupModal({
  open,
  onClose,
  sellingPlanGroupName,
}: DeleteSellingPlanGropuModalProps) {
  const {t} = useTranslation('app.plans.details');
  const fetcher = useFetcher<WithToast>();
  const {showToasts} = useToasts();
  const loading = fetcher.state === 'submitting';

  useEffect(() => {
    if (!loading) {
      showToasts(fetcher.data);
    }
  }, [fetcher.data, loading, showToasts]);

  function closeModal() {
    onClose();
  }

  async function deletePlan() {
    fetcher.submit(new FormData(), {method: 'post', action: './delete'});
  }

  return (
    <Modal open={open} onHide={closeModal}>
      <Box padding="400">
        <Text as="p">
          {t('deleteSellingPlanGroupModal.content', {
            sellingPlanGroupName,
          })}
        </Text>
      </Box>
      <TitleBar title={t('deleteSellingPlanGroupModal.title')}>
        <button type="button" onClick={onClose}>
          {t('deleteSellingPlanGroupModal.cancelButton')}
        </button>
        <button
          type="button"
          variant="primary"
          tone="critical"
          loading={loading ? '' : undefined}
          onClick={deletePlan}
        >
          {t('deleteSellingPlanGroupModal.deleteButton')}
        </button>
      </TitleBar>
    </Modal>
  );
}
