import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  Badge,
  BlockStack,
  Box,
  Grid,
  Icon,
  InlineStack,
  Link,
  Text,
  Thumbnail,
  useBreakpoints,
} from '@shopify/polaris';
import {AlertCircleIcon, ImageIcon} from '@shopify/polaris-icons';
import {useTranslation} from 'react-i18next';
import type {SubscriptionContractDetailsLine} from '~/types/contracts';
import {formatPrice} from '~/utils/helpers/money';

export interface SubscriptionLineItemProps {
  line: SubscriptionContractDetailsLine;
  isOutOfStock?: boolean;
}

export function SubscriptionLineItem({
  line,
  isOutOfStock = false,
}: SubscriptionLineItemProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;
  const {smDown} = useBreakpoints();
  const isMobile = smDown;

  const {
    title,
    variantTitle,
    variantImage,
    currentPrice,
    pricingPolicy,
    lineDiscountedPrice,
    quantity,
    productId,
  } = line;

  const oneTimePurchasePrice = pricingPolicy?.basePrice;

  return (
    <InlineStack
      gap={{xs: '800', sm: '200', md: '200', lg: '200', xl: '200'}}
      align="space-between"
      blockAlign="start"
      wrap={false}
    >
      <Grid
        gap={{
          xs: '1rem',
          sm: '1rem',
          md: '0.5rem',
          lg: '0.5rem',
          xl: '0.5rem',
        }}
      >
        <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 2, xl: 2}}>
          <Thumbnail
            source={variantImage?.url ?? ImageIcon}
            alt={variantImage?.altText ?? ''}
            size={isMobile ? 'medium' : 'small'}
          />
        </Grid.Cell>
        <Grid.Cell columnSpan={{xs: 5, sm: 5, md: 5, lg: 7, xl: 7}}>
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
              <Box>
                <Text as="span" variant="bodySm">
                  <Badge size="small">{variantTitle}</Badge>
                </Text>
              </Box>
            ) : null}
            {oneTimePurchasePrice ? (
              <Text as="p" variant="bodySm" tone="subdued">
                {t('edit.details.oneTimePurchasePrice', {
                  price: formatPrice({
                    currency: oneTimePurchasePrice.currencyCode,
                    amount: oneTimePurchasePrice.amount,
                    locale,
                  }),
                })}
              </Text>
            ) : null}
            {isOutOfStock ? (
              <Box color="text-warning">
                <InlineStack align="start" wrap={false}>
                  <Box paddingInlineEnd="100">
                    <Icon source={AlertCircleIcon} tone="warning" />
                  </Box>
                  <Text as="p" variant="bodyMd">
                    {t('edit.details.outOfStock')}
                  </Text>
                </InlineStack>
              </Box>
            ) : null}
            {isMobile ? (
              <TotalCostBreakdown
                currentPrice={currentPrice}
                quantity={quantity}
                lineDiscountedPrice={lineDiscountedPrice}
                isMobile={isMobile}
                locale={locale}
              />
            ) : null}
          </BlockStack>
        </Grid.Cell>
      </Grid>
      {isMobile ? null : (
        <TotalCostBreakdown
          currentPrice={currentPrice}
          quantity={quantity}
          lineDiscountedPrice={lineDiscountedPrice}
          isMobile={isMobile}
          locale={locale}
        />
      )}
    </InlineStack>
  );
}

const TotalCostBreakdown = ({
  currentPrice,
  quantity,
  lineDiscountedPrice,
  isMobile,
  locale,
}) => (
  <Box paddingBlockStart={isMobile ? '200' : '0'}>
    <InlineStack
      gap="800"
      align={isMobile ? 'space-between' : 'start'}
      wrap={false}
    >
      <InlineStack gap="200" wrap={false}>
        <Text as="p" tone="subdued">
          {formatPrice({
            currency: currentPrice.currencyCode,
            amount: currentPrice.amount,
            locale,
          })}
        </Text>
        <Text as="p">x</Text>
        <Text as="p">{quantity}</Text>
      </InlineStack>
      <Text as="p">
        {formatPrice({
          currency: lineDiscountedPrice.currencyCode,
          amount: lineDiscountedPrice.amount,
          locale,
        })}
      </Text>
    </InlineStack>
  </Box>
);
