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

import type {
  PauseSubscriptionContractMutation as PauseSubscriptionContractMutationData,
  PauseSubscriptionContractMutationVariables,
} from 'generatedTypes/customer.generated';
import PauseSubscriptionContractMutation from './graphql/PauseSubscriptionContractMutation';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';

interface PauseSubscriptionModalProps {
  contractId: string;
  onPauseSubscription: () => void;
}

export const PAUSE_MODAL_ID = 'pause-subscription-modal';

export function PauseSubscriptionModal({
  contractId,
  onPauseSubscription,
}: PauseSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [pauseSubscriptionContract] = useGraphqlApi<
    PauseSubscriptionContractMutationData,
    PauseSubscriptionContractMutationVariables
  >();

  function clearErrorState() {
    setError(false);
    setErrorMessage(undefined);
  }

  async function handlePauseSubscription() {
    setLoading(true);
    const result = await pauseSubscriptionContract(
      PauseSubscriptionContractMutation,
      {
        subscriptionContractId: contractId,
      },
    );

    if (result?.subscriptionContractPause?.contract?.status !== 'PAUSED') {
      setError(true);

      if (result?.subscriptionContractPause?.userErrors?.length) {
        setErrorMessage(
          result?.subscriptionContractPause?.userErrors[0].message,
        );
      }

      setLoading(false);
      return;
    }

    setLoading(false);
    clearErrorState();
    overlay.close(PAUSE_MODAL_ID);

    onPauseSubscription();
  }

  return (
    <Modal
      padding
      title={i18n.translate('pauseSubscriptionModal.title')}
      onClose={clearErrorState}
      id={PAUSE_MODAL_ID}
    >
      <BlockStack spacing="loose">
        {error ? (
          <Banner
            status="critical"
            title={i18n.translate('pauseSubscriptionModal.errorBannerTitle')}
          >
            {errorMessage}
          </Banner>
        ) : null}
        <TextBlock>
          {i18n.translate('pauseSubscriptionModal.description')}
        </TextBlock>
        <InlineLayout spacing="loose" columns={['fill', 'auto', 'auto']}>
          <InlineSpacer />
          <Button onPress={() => overlay.close(PAUSE_MODAL_ID)} kind="plain">
            {i18n.translate('pauseSubscriptionModal.close')}
          </Button>
          <Button onPress={handlePauseSubscription} loading={loading}>
            {i18n.translate('pauseSubscriptionModal.action')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
