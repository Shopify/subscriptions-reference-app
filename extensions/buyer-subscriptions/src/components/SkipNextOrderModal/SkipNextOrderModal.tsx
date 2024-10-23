import {useState} from 'react';
import {
  Button,
  Banner,
  InlineLayout,
  InlineSpacer,
  Modal,
  TextBlock,
  BlockStack,
} from '@shopify/ui-extensions-react/customer-account';
import {useFormatDate} from 'utilities/hooks/useFormatDate';

import SkipBillingCycleMutation from './graphql/SkipBillingCycleMutation';

import type {
  SkipBillingCycleMutation as SkipBillingCycleMutationData,
  SkipBillingCycleMutationVariables,
} from 'generatedTypes/customer.generated';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';

export interface SkipNextOrderModalProps {
  contractId: string;
  cycleIndexToSkip: number;
  resumeDate: string;
  onSkipOrder: () => void;
}

export const SKIP_NEXT_ORDER_MODAL_ID = 'skip-next-order-modal';

export function SkipNextOrderModal({
  contractId,
  cycleIndexToSkip,
  resumeDate,
  onSkipOrder,
}: SkipNextOrderModalProps) {
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [skipBillingCycle] = useGraphqlApi<
    SkipBillingCycleMutationData,
    SkipBillingCycleMutationVariables
  >();

  const formatDate = useFormatDate();

  function clearErrorState() {
    setError(false);
    setErrorMessage(undefined);
  }

  async function handleSkipNextOrder() {
    setLoading(true);
    const result = await skipBillingCycle(SkipBillingCycleMutation, {
      subscriptionContractId: contractId,
      billingCycleIndex: cycleIndexToSkip,
    });

    if (!result?.subscriptionBillingCycleSkip?.billingCycle?.skipped) {
      setError(true);

      if (result?.subscriptionBillingCycleSkip?.userErrors?.length) {
        setErrorMessage(
          result?.subscriptionBillingCycleSkip?.userErrors[0].message,
        );
      }

      setLoading(false);
      return;
    }

    clearErrorState();
    setLoading(false);
    overlay.close(SKIP_NEXT_ORDER_MODAL_ID);
    onSkipOrder();
  }

  return (
    <Modal
      padding
      title={i18n.translate('skipNextOrder.text')}
      onClose={clearErrorState}
      id={SKIP_NEXT_ORDER_MODAL_ID}
    >
      <BlockStack spacing="loose">
        {error && (
          <Banner
            status="critical"
            title={i18n.translate('skipNextOrder.errorBannerTitle')}
          >
            {errorMessage}
          </Banner>
        )}
        <TextBlock>
          {resumeDate
            ? i18n.translate('skipNextOrder.date', {
                date: formatDate(resumeDate),
              })
            : i18n.translate('skipNextOrder.generic')}
        </TextBlock>
        <InlineLayout spacing="loose" columns={['fill', 'auto', 'auto']}>
          <InlineSpacer />
          <Button
            onPress={() => overlay.close(SKIP_NEXT_ORDER_MODAL_ID)}
            kind="plain"
          >
            {i18n.translate('skipNextOrder.close')}
          </Button>
          <Button onPress={handleSkipNextOrder} loading={loading}>
            {i18n.translate('skip')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
