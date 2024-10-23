import type {FetcherWithComponents} from '@remix-run/react';
import {useFetcher} from '@remix-run/react';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {BlockStack, Box, Divider, InlineStack, Text} from '@shopify/polaris';
import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useShopInfo} from '~/context/ShopContext';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';
import type {PaymentInstrument} from '~/types/contracts';
import {paymentInstrumentIsPaypal} from '~/utils/helpers/paymentMethods';

export interface CustomerPaymentMethodEmailModalProps {
  open: boolean;
  onClose: () => void;
  instrument: NonNullable<PaymentInstrument>;
  customerEmail: string;
  customerDisplayName: string;
}

interface PaymentMethodEmailFetcherData {
  error?: boolean;
}

export function CustomerPaymentMethodEmailModal({
  open,
  onClose,
  instrument,
  customerEmail,
  customerDisplayName,
}: CustomerPaymentMethodEmailModalProps) {
  const fetcher: FetcherWithComponents<
    WithToast<PaymentMethodEmailFetcherData>
  > = useFetcher();
  const {t} = useTranslation('app.contracts');
  const shopInfo = useShopInfo();
  const {showToasts} = useToasts();

  const isLoadingOrSubmitting =
    fetcher.state === 'loading' || fetcher.state === 'submitting';

  useEffect(() => {
    if (!isLoadingOrSubmitting) {
      showToasts(fetcher.data);

      if (fetcher.data && !fetcher.data.error) {
        onClose();
      }

      fetcher.data = undefined;
    }
  }, [fetcher, isLoadingOrSubmitting, onClose, showToasts]);

  const {contactEmail: shopContactEmail, name: shopName} = shopInfo;

  const subjectMessage = t('paymentMethodDetails.emailModal.subjectMessage', {
    shopName,
  });

  const descriptionText = paymentInstrumentIsPaypal(instrument)
    ? t('paymentMethodDetails.emailModal.descriptionOther', {
        customerName: customerDisplayName,
      })
    : t('paymentMethodDetails.emailModal.descriptionCreditCard', {
        customerName: customerDisplayName,
        lastDigits: instrument.lastDigits,
      });

  function emailField(name: string, text: string) {
    return (
      <InlineStack gap="100">
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {name}
        </Text>
        <Text as="span" variant="bodyMd">
          {text}
        </Text>
      </InlineStack>
    );
  }

  async function sendEmail() {
    fetcher.submit({}, {method: 'post', action: './payment-update'});
  }

  return (
    <Modal open={open} onHide={onClose}>
      <Box padding="400">
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            {descriptionText}
          </Text>
          <Divider />
          {emailField(
            t('paymentMethodDetails.emailModal.fromField'),
            shopContactEmail,
          )}
          <Divider />
          {emailField(
            t('paymentMethodDetails.emailModal.toField'),
            customerEmail,
          )}
          <Divider />
          {emailField(
            t('paymentMethodDetails.emailModal.subjectField'),
            subjectMessage,
          )}
        </BlockStack>
      </Box>
      <TitleBar title={t('paymentMethodDetails.emailModal.title')}>
        <button onClick={onClose}>
          {t('paymentMethodDetails.emailModal.actions.cancel')}
        </button>
        <button
          variant="primary"
          disabled={isLoadingOrSubmitting}
          onClick={sendEmail}
        >
          {t('paymentMethodDetails.emailModal.actions.sendEmail')}
        </button>
      </TitleBar>
    </Modal>
  );
}
