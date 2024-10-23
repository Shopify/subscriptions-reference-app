import {
  Banner,
  Modal,
  BlockStack,
  Button,
  InlineSpacer,
  InlineLayout,
  Text,
} from '@shopify/ui-extensions-react/customer-account';

import type {BillingCycle} from 'types';

import {useFormatDate} from 'utilities/hooks/useFormatDate';

import {useToggleSkipOrder} from './hooks/useToggleOrderSkipped';
import {useExtensionApi} from 'foundation/Api';

export interface UpcomingOrdersModalProps {
  contractId: string;
  upcomingBillingCycles: BillingCycle[];
  refetchLoading: boolean;
  refetchSubscriptionContract: () => void;
}

export const UPCOMING_ORDERS_MODAL_ID = 'skip-next-order-modal';

export function UpcomingOrdersModal({
  contractId,
  upcomingBillingCycles,
  refetchLoading,
  refetchSubscriptionContract,
}: UpcomingOrdersModalProps) {
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();
  const formatDate = useFormatDate();

  const upcomingBillingCyclesToDisplay = upcomingBillingCycles.slice(
    0,
    upcomingBillingCycles.length - 1,
  );
  const {
    bannerStatus,
    bannerText,
    cycleIndexLoading,
    toggleSkipOrder,
    onCloseModal,
  } = useToggleSkipOrder({
    contractId,
    refetchSubscriptionContract,
    refetchLoading,
  });

  return (
    <Modal
      id={UPCOMING_ORDERS_MODAL_ID}
      title={i18n.translate('upcomingOrdersModal.title')}
      onClose={onCloseModal}
      padding
    >
      <BlockStack spacing="loose">
        {bannerText && bannerStatus && (
          <Banner status={bannerStatus}>{bannerText}</Banner>
        )}
        <BlockStack spacing="base">
          {upcomingBillingCyclesToDisplay.map(
            ({cycleIndex, skipped, billingAttemptExpectedDate}) => {
              const orderDate = formatDate(billingAttemptExpectedDate);
              return (
                <InlineLayout
                  key={cycleIndex}
                  spacing="base"
                  columns={['fill', 'auto']}
                >
                  <Text appearance={skipped ? 'subdued' : undefined}>
                    {skipped
                      ? ` ${i18n.translate(
                          'upcomingOrdersModal.skippedOrderLabel',
                          {
                            skippedOrderDate: orderDate,
                          },
                        )}`
                      : orderDate}
                  </Text>
                  <Button
                    kind="plain"
                    loading={cycleIndexLoading === cycleIndex}
                    onPress={() => toggleSkipOrder(cycleIndex, skipped)}
                    accessibilityLabel={i18n.translate(
                      skipped
                        ? 'upcomingOrdersModal.unskipOrderAccessibilityLabel'
                        : 'upcomingOrdersModal.skipOrderAccessibilityLabel',
                      {orderDate},
                    )}
                  >
                    {i18n.translate(
                      skipped
                        ? 'upcomingOrdersModal.unSkipOrder'
                        : 'upcomingOrdersModal.skipOrder',
                    )}
                  </Button>
                </InlineLayout>
              );
            },
          )}
        </BlockStack>
        <InlineLayout columns={['fill', 'auto']}>
          <InlineSpacer />
          <Button onPress={() => overlay.close(UPCOMING_ORDERS_MODAL_ID)}>
            {i18n.translate('upcomingOrdersModal.close')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
