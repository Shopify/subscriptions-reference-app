import {
  Banner,
  BlockStack,
  Box,
  Button,
  InlineStack,
  TextField as PolarisTextField,
  Text,
} from '@shopify/polaris';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useFormContext} from '@rvf/remix';
import {discountTextFromCycleDiscount} from '~/utils/helpers/contracts';
import {formatPrice, getSymbolFromCurrency} from '~/utils/helpers/money';
import {createNewPricingPolicy} from '~/utils/helpers/subscriptionLines';
import {MAX_MONEY_AMOUNT} from '~/utils/helpers/zod';
import type {SubscriptionLine} from '../../../../validator';

export interface EditPriceModalProps {
  index: number;
  open: boolean;
  onClose: () => void;
  oneTimePurchasePriceChanged: boolean;
  currencyCode: string;
}

export function EditPriceModal({
  index,
  open,
  onClose,
  oneTimePurchasePriceChanged,
  currencyCode,
}: EditPriceModalProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;
  const form = useFormContext<{lines: SubscriptionLine[]}>();

  const currencySymbol = getSymbolFromCurrency(currencyCode);

  const currentLine = form.value('lines')[index];
  const initialPrice = currentLine.currentPrice.amount.toString();
  const oneTimePurchasePrice = currentLine.currentOneTimePurchasePrice;

  const [showBanner, setShowBanner] = useState(true);
  const [error, setError] = useState('');
  const [newPrice, setNewPrice] = useState<string>(initialPrice);

  const pricingPolicy = currentLine.pricingPolicy;

  const showPriceWarning =
    showBanner && oneTimePurchasePriceChanged && oneTimePurchasePrice;

  const discountLabelText =
    pricingPolicy && pricingPolicy.cycleDiscounts.length > 0
      ? discountTextFromCycleDiscount(
          pricingPolicy.cycleDiscounts[0],
          t,
          locale,
        )
      : null;

  // ensures that the price is reset to the initial price when the modal is opened
  useEffect(() => {
    if (open) {
      setNewPrice(initialPrice);
      setError('');
    }
  }, [open, initialPrice, setNewPrice, setError]);

  function onCancel() {
    setNewPrice(initialPrice);
    setError('');
    onClose();
  }

  function handlePriceChange(newPrice: string) {
    const priceAmount = Number(newPrice);
    if (priceAmount > MAX_MONEY_AMOUNT) {
      setError(t('edit.editPriceModal.amountTooLargeError'));
    } else if (priceAmount < 0) {
      setError(t('edit.editPriceModal.amountNegativeError'));
    } else {
      setError('');
    }

    setNewPrice(newPrice);
  }

  function onUpdate() {
    const newLines = [...form.value('lines')];
    const currentLine = newLines[index];
    const lineToUpdate = {
      ...currentLine,
      currentPrice: {
        ...currentLine.currentPrice,
        amount: Number(newPrice),
      },
      ...(currentLine.pricingPolicy &&
        oneTimePurchasePrice && {
          pricingPolicy: createNewPricingPolicy(
            currencyCode,
            oneTimePurchasePrice,
            Number(newPrice),
          ),
        }),
    };
    newLines[index] = lineToUpdate;
    form.setValue('lines', newLines);
    onClose();
  }

  return (
    <Modal onHide={onCancel} open={open}>
      <Box padding="400">
        <BlockStack gap="200">
          {showPriceWarning ? (
            <Banner
              hideIcon
              onDismiss={() => {
                setShowBanner(false);
              }}
            >
              <Text as="p">
                {t('edit.editPriceModal.oneTimePurchasePriceChangedWarning', {
                  title: currentLine.title,
                  newPrice: formatPrice({
                    amount: oneTimePurchasePrice,
                    currency: currencyCode,
                    locale,
                  }),
                })}
              </Text>
            </Banner>
          ) : null}
          <PolarisTextField
            autoComplete="off"
            type="number"
            label={t('edit.editPriceModal.subscriptionPriceLabel')}
            prefix={currencySymbol}
            value={newPrice}
            onChange={handlePriceChange}
            error={error}
          />
          {showPriceWarning ? (
            <InlineStack align="start">
              <Button
                variant="plain"
                onClick={() => {
                  setNewPrice(oneTimePurchasePrice.toString());
                  setShowBanner(false);
                }}
              >
                {t('edit.editPriceModal.updateSubscriptionPrice', {
                  title: currentLine.title,
                })}
              </Button>
            </InlineStack>
          ) : null}
          {discountLabelText ? (
            <Text as="p" variant="bodyMd" tone="subdued">
              {t('edit.editPriceModal.discountLabel', {
                discountAmount: discountLabelText,
                lineTitle: currentLine.title,
              })}
            </Text>
          ) : null}
        </BlockStack>
      </Box>
      <TitleBar title={t('edit.editPriceModal.title')}>
        <button type="button" onClick={onCancel}>
          {t('edit.editPriceModal.actions.cancel')}
        </button>
        <button
          type="button"
          variant="primary"
          disabled={Boolean(error)}
          onClick={onUpdate}
        >
          {t('edit.editPriceModal.actions.update')}
        </button>
      </TitleBar>
    </Modal>
  );
}
