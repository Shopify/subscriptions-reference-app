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
import type {Money} from 'types';
import {useFormatDate} from 'utilities/hooks/useFormatDate';

import ActivateSubscriptionContractMutation from './graphql/ActivateSubscriptionMutation';

import type {
  ActivateSubscriptionContractMutation as ActivateSubscriptionContractMutationData,
  ActivateSubscriptionContractMutationVariables,
} from 'generatedTypes/customer.generated';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';

interface ResumeSubscriptionModalProps {
  contractId: string;
  resumeDate?: string | null;
  lastOrderPrice?: Money | null;
  nextOrderPrice?: Money | null;
  onResumeSubscription: () => void;
}

export const RESUME_MODAL_ID = 'resume-subscription-modal';

export function ResumeSubscriptionModal({
  contractId,
  resumeDate,
  lastOrderPrice,
  nextOrderPrice,
  onResumeSubscription,
}: ResumeSubscriptionModalProps) {
  const {
    i18n,
    ui: {overlay},
  } = useExtensionApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const formatDate = useFormatDate();

  const [activateSubscriptionContract] = useGraphqlApi<
    ActivateSubscriptionContractMutationData,
    ActivateSubscriptionContractMutationVariables
  >();

  const showPriceChanged =
    lastOrderPrice &&
    nextOrderPrice &&
    lastOrderPrice.amount !== nextOrderPrice.amount;

  function clearErrorState() {
    setError(false);
    setErrorMessage(undefined);
  }

  async function handleResumeSubscription() {
    setLoading(true);
    const result = await activateSubscriptionContract(
      ActivateSubscriptionContractMutation,
      {
        subscriptionContractId: contractId,
      },
    );

    if (result?.subscriptionContractActivate?.contract?.status !== 'ACTIVE') {
      setError(true);

      if (result?.subscriptionContractActivate?.userErrors?.length) {
        setErrorMessage(
          result?.subscriptionContractActivate?.userErrors[0].message,
        );
      }

      setLoading(false);
      return;
    }

    overlay.close(RESUME_MODAL_ID);
    clearErrorState();
    setLoading(false);
    onResumeSubscription();
  }

  return (
    <Modal
      padding
      title={i18n.translate('resumeSubscriptionModal.title')}
      onClose={clearErrorState}
      id={RESUME_MODAL_ID}
    >
      <BlockStack spacing="loose">
        {error ? (
          <Banner
            status="critical"
            title={i18n.translate('resumeSubscriptionModal.errorBannerTitle')}
          >
            {errorMessage}
          </Banner>
        ) : null}
        <TextBlock>
          {resumeDate
            ? i18n.translate('resumeSubscriptionModal.descriptionWithDate', {
                date: formatDate(resumeDate),
              })
            : i18n.translate('resumeSubscriptionModal.description')}
          {showPriceChanged
            ? ` ${i18n.translate(
                'resumeSubscriptionModal.descriptionPriceChanged',
                {
                  price: i18n.formatCurrency(Number(nextOrderPrice.amount), {
                    currency: nextOrderPrice.currencyCode,
                    currencyDisplay: 'narrowSymbol',
                  }),
                },
              )}`
            : ''}
        </TextBlock>
        <InlineLayout spacing="loose" columns={['fill', 'auto', 'auto']}>
          <InlineSpacer />
          <Button onPress={() => overlay.close(RESUME_MODAL_ID)} kind="plain">
            {i18n.translate('resumeSubscriptionModal.close')}
          </Button>
          <Button onPress={handleResumeSubscription} loading={loading}>
            {i18n.translate('resumeSubscriptionModal.continue')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
