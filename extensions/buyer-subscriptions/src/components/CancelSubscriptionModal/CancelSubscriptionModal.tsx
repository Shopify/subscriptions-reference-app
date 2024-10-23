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
import {useGraphqlApi, useExtensionApi} from 'foundation/Api';

import CancelSubscriptionMutation from './graphql/CancelSubscriptionMutation';
import type {
  CancelSubscriptionContractMutation as CancelSubscriptionContractMutationData,
  CancelSubscriptionContractMutationVariables,
} from 'generatedTypes/customer.generated';

interface CancelSubscriptionModalProps {
  contractId: string;
  onCancelSubscription: () => void;
}

export const CANCEL_MODAL_ID = 'cancel-subscription-modal';

export function CancelSubscriptionModal({
  contractId,
  onCancelSubscription,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();

  const [cancelSubscriptionContract] = useGraphqlApi<
    CancelSubscriptionContractMutationData,
    CancelSubscriptionContractMutationVariables
  >();

  function clearErrorState() {
    setError(false);
    setErrorMessage(undefined);
  }

  async function handleCancelSubscription() {
    setLoading(true);
    const result = await cancelSubscriptionContract(
      CancelSubscriptionMutation,
      {
        subscriptionContractId: contractId,
      },
    );

    if (result?.subscriptionContractCancel?.contract?.status !== 'CANCELLED') {
      setError(true);

      if (result?.subscriptionContractCancel?.userErrors?.length) {
        setErrorMessage(
          result?.subscriptionContractCancel?.userErrors[0].message,
        );
      }

      setLoading(false);
      return;
    }

    clearErrorState();
    setLoading(false);
    overlay.close(CANCEL_MODAL_ID);
    onCancelSubscription();
  }

  return (
    <Modal
      padding
      title={i18n.translate('cancelSubscriptionModal.title')}
      onClose={clearErrorState}
      id={CANCEL_MODAL_ID}
    >
      <BlockStack spacing="loose">
        {error ? (
          <Banner
            status="critical"
            title={i18n.translate('cancelSubscriptionModal.errorBannerTitle')}
          >
            {errorMessage}
          </Banner>
        ) : null}
        <TextBlock>
          {i18n.translate('cancelSubscriptionModal.description')}
        </TextBlock>
        <InlineLayout spacing="loose" columns={['fill', 'auto', 'auto']}>
          <InlineSpacer />
          <Button onPress={() => overlay.close(CANCEL_MODAL_ID)} kind="plain">
            {i18n.translate('skipNextOrder.close')}
          </Button>
          <Button
            appearance="critical"
            onPress={handleCancelSubscription}
            loading={loading}
          >
            {i18n.translate('cancelSubscriptionModal.action')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
