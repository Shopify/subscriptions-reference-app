import {useFetcher} from '@remix-run/react';
import {Box, Text} from '@shopify/polaris';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import type {WithToast} from '~/types';
import {SubscriptionPlansActions} from '~/types';
import {useToasts} from '~/hooks';

export interface sellingPlanGroupsDeleteModalProps {
  isDeleteModalVisible: boolean;
  setIsDeleteModalVisible: (value: boolean) => void;
  selectedResources: string[];
  clearSelection: () => void;
}

export default function SellingPlanGroupsDeleteModal({
  isDeleteModalVisible,
  setIsDeleteModalVisible,
  selectedResources,
  clearSelection,
}: sellingPlanGroupsDeleteModalProps) {
  const fetcher = useFetcher<WithToast>();
  const {showToasts} = useToasts();
  const {state: fetcherState} = fetcher;
  const isLoadingOrSubmitting =
    fetcherState === 'loading' || fetcherState === 'submitting';
  const {t} = useTranslation('app.plans');

  const deletePlan = (ids: string[]) => {
    fetcher.submit(
      {ids: ids, _action: SubscriptionPlansActions.Delete},
      {
        method: 'post',
      },
    );
  };

  useEffect(() => {
    if (!isLoadingOrSubmitting) {
      setIsDeleteModalVisible(false);
      clearSelection();
      showToasts(fetcher.data);
    }
  }, [
    clearSelection,
    fetcher.data,
    isLoadingOrSubmitting,
    setIsDeleteModalVisible,
    showToasts,
  ]);

  return (
    <Modal
      open={isDeleteModalVisible}
      onHide={() => setIsDeleteModalVisible(false)}
    >
      <Box padding="400">
        <Text as="p" variant="bodyMd">
          {t('table.deletePlan.modal.description', {
            count: selectedResources.length,
          })}
        </Text>
      </Box>
      <TitleBar
        title={t('table.deletePlan.modal.title', {
          count: selectedResources.length,
        })}
      >
        <button type="button" onClick={() => setIsDeleteModalVisible(false)}>
          {t('table.deletePlan.modal.actions.cancel')}
        </button>
        <button
          type="button"
          variant="primary"
          tone="critical"
          loading={isLoadingOrSubmitting ? '' : undefined}
          onClick={() => deletePlan(selectedResources)}
        >
          {t('table.deletePlan.modal.actions.delete', {
            count: selectedResources.length,
          })}
        </button>
      </TitleBar>
    </Modal>
  );
}
