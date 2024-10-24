import {useState, useEffect} from 'react';
import {
  Button,
  Banner,
  InlineLayout,
  Text,
  InlineSpacer,
  Modal,
  Link,
  BlockStack,
  Choice,
  ChoiceList,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';
import {PaymentInstrument} from 'components';

import PaymentMethodsQuery from './graphql/PaymentMethodsQuery';
import type {
  PaymentMethodsQuery as PaymentMethodsQueryData,
  UpdatePaymentMethodMutation as UpdatePaymentMethodMutationData,
  UpdatePaymentMethodMutationVariables,
} from 'generatedTypes/customer.generated';
import UpdatePaymentMethodMutation from './graphql/UpdatePaymentMethodMutation';
import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';

interface UpdatePaymentMethodModalProps {
  opened: boolean;
  contractId: string;
  currentPaymentInstrumentId?: string;
  onPaymentMethodUpdated: () => void;
}

export const UPDATE_PAYMENT_MODAL_ID = 'update-payment-method-modal';

export function UpdatePaymentMethodModal({
  opened,
  contractId,
  currentPaymentInstrumentId,
  onPaymentMethodUpdated,
}: UpdatePaymentMethodModalProps) {
  const {
    i18n,
    ui: {overlay},
    navigation: {navigate},
  } = useExtensionApi();

  const [paymentMethodsQuery, paymentMethodsResponse] =
    useGraphqlApi<PaymentMethodsQueryData>();
  const [updatePaymentMethod] = useGraphqlApi<
    UpdatePaymentMethodMutationData,
    UpdatePaymentMethodMutationVariables
  >();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    currentPaymentInstrumentId || '',
  );
  const [updatePaymentMethodLoading, setUpdatePaymentMethodLoading] =
    useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (opened) {
      paymentMethodsQuery(PaymentMethodsQuery);
    }
  }, [paymentMethodsQuery, opened]);

  const paymentMethods = nodesFromEdges(
    paymentMethodsResponse.data?.customer.creditCards.edges || [],
  );

  const filteredPaymentMethods = paymentMethods.filter(
    (paymentMethod) =>
      paymentMethod.walletType !== 'SHOP_PAY' ||
      paymentMethod.id === currentPaymentInstrumentId,
  );

  const paypalBillingAgreement =
    paymentMethodsResponse.data?.customer.paypalBillingAgreement;

  function clearErrorState() {
    setError(false);
    setErrorMessage(undefined);
  }

  async function handleUpdatePaymentMethod() {
    setUpdatePaymentMethodLoading(true);
    const result = await updatePaymentMethod(UpdatePaymentMethodMutation, {
      subscriptionContractId: contractId,
      paymentInstrumentId: selectedPaymentMethod,
    });

    if (
      result?.subscriptionContractChangePaymentInstrument?.contract
        ?.paymentInstrument?.id !== selectedPaymentMethod
    ) {
      setError(true);

      if (
        result?.subscriptionContractChangePaymentInstrument?.userErrors.length
      ) {
        setErrorMessage(
          result?.subscriptionContractChangePaymentInstrument?.userErrors[0]
            .message,
        );
      }

      setUpdatePaymentMethodLoading(false);
      return;
    }

    clearErrorState();
    setUpdatePaymentMethodLoading(false);
    overlay.close(UPDATE_PAYMENT_MODAL_ID);
    onPaymentMethodUpdated();
  }

  function navigateToAccountPage() {
    overlay.close(UPDATE_PAYMENT_MODAL_ID);

    setTimeout(() => {
      navigate('shopify:/customer-account/profile');
    }, 750);
  }

  return (
    <Modal
      padding
      title={i18n.translate('paymentModal.title')}
      onClose={clearErrorState}
      id={UPDATE_PAYMENT_MODAL_ID}
    >
      <BlockStack spacing="loose">
        {error ? (
          <Banner
            status="critical"
            title={i18n.translate('paymentModal.errorBannerTitle')}
          >
            {errorMessage}
          </Banner>
        ) : null}
        <InlineLayout spacing="none" columns={['fill', 'auto']}>
          <Text>{i18n.translate('paymentModal.paymentMethod')}</Text>
          <Link onPress={navigateToAccountPage}>
            {i18n.translate('paymentModal.edit')}
          </Link>
        </InlineLayout>
        <ChoiceList
          name="choice"
          value={selectedPaymentMethod}
          onChange={(
            value: string | string[] | React.ChangeEvent<HTMLInputElement>,
          ) => {
            if (Array.isArray(value)) {
              setSelectedPaymentMethod(value[0]);
            } else if (typeof value === 'string') {
              setSelectedPaymentMethod(value);
            } else if (value.target.value) {
              setSelectedPaymentMethod(value.target.value);
            }
          }}
        >
          <BlockStack>
            {filteredPaymentMethods.map((paymentMethod) => (
              <Choice id={paymentMethod.id} key={paymentMethod.id}>
                <PaymentInstrument paymentInstrument={paymentMethod} />
              </Choice>
            ))}
            {paypalBillingAgreement && (
              <Choice id={paypalBillingAgreement.id}>
                <PaymentInstrument paymentInstrument={paypalBillingAgreement} />
              </Choice>
            )}
          </BlockStack>
        </ChoiceList>
        <InlineLayout spacing="loose" columns={['fill', 'auto', 'auto']}>
          <InlineSpacer />
          <Button
            onPress={() => {
              overlay.close(UPDATE_PAYMENT_MODAL_ID);
              clearErrorState();
            }}
            kind="plain"
          >
            {i18n.translate('paymentModal.close')}
          </Button>
          <Button
            onPress={handleUpdatePaymentMethod}
            loading={updatePaymentMethodLoading}
            disabled={
              !selectedPaymentMethod ||
              selectedPaymentMethod === currentPaymentInstrumentId
            }
          >
            {i18n.translate('paymentModal.save')}
          </Button>
        </InlineLayout>
      </BlockStack>
    </Modal>
  );
}
