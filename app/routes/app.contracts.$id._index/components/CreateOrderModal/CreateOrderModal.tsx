import {
  Badge,
  BlockStack,
  Box,
  Icon,
  InlineStack,
  Text,
  Thumbnail,
} from '@shopify/polaris';
import {Modal, TitleBar} from '@shopify/app-bridge-react';
import {useTranslation} from 'react-i18next';
import {AlertTriangleIcon, ImageIcon} from '@shopify/polaris-icons';
import type {OutOfStockProductVariant} from '~/types';

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreateOrder: () => void;
  outOfStockVariants: OutOfStockProductVariant[];
}

export function CreateOrderModal({
  onCreateOrder,
  open,
  onClose,
  outOfStockVariants,
}: CreateOrderModalProps) {
  const {t} = useTranslation('app.contracts');

  return (
    <Modal open={open} onHide={onClose}>
      <Box paddingInline="200" paddingBlockStart="200" paddingBlockEnd="100">
        <Box
          padding="200"
          background={'bg-surface-warning'}
          borderRadius="200"
          color="text-warning"
        >
          <InlineStack align="start" direction="row" wrap={false}>
            <Box paddingInlineEnd="200">
              <Icon source={AlertTriangleIcon} tone="warning" />
            </Box>
            <Text as="p">{t('failedOrder.modal.inventoryWarning')}</Text>
          </InlineStack>
        </Box>
      </Box>
      {outOfStockVariants ? (
        <Box padding="200">
          <Box paddingBlockEnd="200">
            <Text as="p" variant="bodyMd" fontWeight="medium">
              {t('failedOrder.modal.outOfStock', {
                count: outOfStockVariants.length,
              })}
            </Text>
          </Box>
          <BlockStack gap="200">
            {outOfStockVariants.map((variant) => (
              <Box
                key={variant.id}
                padding="200"
                borderStyle="solid"
                borderColor="border-tertiary"
                borderWidth="025"
                borderRadius="200"
              >
                <InlineStack gap="200" blockAlign="start" wrap={false}>
                  <Thumbnail
                    source={variant.image?.originalSrc ?? ImageIcon}
                    alt={variant.image?.altText ?? ''}
                    size="small"
                  />
                  <BlockStack gap="050">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {variant.product.title}
                    </Text>
                    {variant.title ? (
                      <Box>
                        <Text as="span" variant="bodySm">
                          <Badge size="small">{variant.title}</Badge>
                        </Text>
                      </Box>
                    ) : null}
                  </BlockStack>
                </InlineStack>
              </Box>
            ))}
          </BlockStack>
        </Box>
      ) : null}
      <TitleBar title={t('failedOrder.modal.title')}>
        <button
          variant="primary"
          onClick={() => {
            onCreateOrder();
            onClose();
          }}
        >
          {t('failedOrder.modal.actions.ignoreAndCreate')}
        </button>
        <button onClick={onClose}>
          {t('failedOrder.modal.actions.cancel')}
        </button>
      </TitleBar>
    </Modal>
  );
}
