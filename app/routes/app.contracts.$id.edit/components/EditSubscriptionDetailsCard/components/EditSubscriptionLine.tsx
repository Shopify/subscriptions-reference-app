import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Icon,
  InlineStack,
  Link,
  Text,
  Thumbnail,
  Tooltip,
  useBreakpoints,
} from '@shopify/polaris';
import {DeleteIcon, ImageIcon, InfoIcon} from '@shopify/polaris-icons';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {TextField} from '~/components/TextField';
import {type SubscriptionLine} from '../../../validator';
import {EditPriceModal} from './EditPriceModal/EditPriceModal';
import {formatPrice} from '~/utils/helpers/money';

export interface EditSubscriptionLineProps {
  line: SubscriptionLine;
  index: number;
  currencyCode: string;
  removeLine?: (index: number) => void;
}

export function EditSubscriptionLine({
  line,
  index,
  currencyCode,
  removeLine,
}: EditSubscriptionLineProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;
  const {smDown: isMobile} = useBreakpoints();
  const {
    title,
    variantTitle,
    variantImage,
    productId,
    currentPrice,
    currentOneTimePurchasePrice,
    pricingPolicy,
  } = line;

  const [priceModalOpen, setPriceModalOpen] = useState(false);

  const oneTimePurchasePriceChanged =
    pricingPolicy?.basePrice.amount && currentOneTimePurchasePrice
      ? Number(currentOneTimePurchasePrice) !==
        Number(pricingPolicy.basePrice.amount)
      : false;

  return (
    <>
      <InlineStack
        gap={{xs: '400', md: '800'}}
        align="start"
        blockAlign="center"
        wrap={isMobile ? true : false}
      >
        <InlineStack gap="300" blockAlign="start" wrap={false}>
          <Thumbnail
            source={variantImage?.url ?? ImageIcon}
            alt={variantImage?.altText ?? ''}
            size="small"
          />
          <BlockStack gap="050">
            <Link
              removeUnderline
              url={
                productId
                  ? `shopify://admin/products/${parseGid(productId)}`
                  : ''
              }
            >
              <Text as="p" variant="bodyMd" fontWeight="medium">
                {title}
              </Text>
            </Link>
            {variantTitle ? (
              // wrap the badge to prevent it from taking up the whole parent's width
              <Box>
                <Text as="span" variant="bodySm">
                  <Badge size="small">{variantTitle}</Badge>
                </Text>
              </Box>
            ) : null}
            {currentOneTimePurchasePrice ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {t('edit.details.oneTimePurchasePrice', {
                  price: formatPrice({
                    amount: currentOneTimePurchasePrice,
                    currency: currencyCode,
                    locale,
                  }),
                })}
              </Text>
            ) : null}
          </BlockStack>
        </InlineStack>
        {!isMobile && <div style={{flexGrow: 1}} />}
        <div style={{flexGrow: isMobile ? 1 : 0}}>
          <InlineStack
            gap="1000"
            align="space-between"
            blockAlign="center"
            wrap={false}
          >
            <Box maxWidth={isMobile ? '70%' : '6rem'}>
              <TextField
                name={`lines[${index}].quantity`}
                type="number"
                min={1}
                label={t('edit.details.quantity')}
                labelHidden
              />
            </Box>
            <Box width={isMobile ? undefined : '4rem'}>
              <Link
                removeUnderline
                onClick={() => setPriceModalOpen(true)}
                accessibilityLabel={t('edit.editPriceModal.title')}
              >
                {formatPrice({
                  amount: currentPrice.amount,
                  currency: currentPrice.currencyCode,
                  locale,
                })}
              </Link>
            </Box>
            {oneTimePurchasePriceChanged ? (
              <Box width="1.25rem">
                <Tooltip
                  content={t('edit.details.oneTimePurchasePriceChanged')}
                >
                  <Icon
                    source={InfoIcon}
                    accessibilityLabel={t(
                      'edit.details.oneTimePurchasePriceChanged',
                    )}
                  />
                </Tooltip>
              </Box>
            ) : null}
            {removeLine ? (
              <Button
                variant="plain"
                accessibilityLabel={t('edit.details.removeLine')}
                onClick={() => {
                  removeLine(index);
                }}
                icon={DeleteIcon}
              />
            ) : null}
          </InlineStack>
        </div>
      </InlineStack>
      <EditPriceModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        currencyCode={currencyCode}
        oneTimePurchasePriceChanged={oneTimePurchasePriceChanged}
        index={index}
      />
    </>
  );
}
