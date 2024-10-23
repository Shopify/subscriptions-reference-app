import {
  Text,
  BlockStack,
  InlineLayout,
  ProductThumbnail,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';
import type {SubscriptionLine} from 'types';

export function SubscriptionLineItem({line}: {line: SubscriptionLine}) {
  const {i18n} = useExtensionApi();

  const currentPrice = Number(line.currentPrice.amount);
  const discountedPrice = Number(line.lineDiscountedPrice.amount);
  const currency = line.currentPrice.currencyCode;

  const isDiscounted = discountedPrice < currentPrice * line.quantity;

  return (
    <InlineLayout
      columns={['auto', 'fill', 'auto']}
      spacing="base"
      blockAlignment="center"
      inlineAlignment="start"
    >
      <ProductThumbnail source={line.image?.url} badge={line.quantity} />
      <BlockStack spacing="extraTight">
        <Text>{line.title}</Text>
        {line.variantTitle && (
          <Text appearance="subdued">{line.variantTitle}</Text>
        )}
        {line.quantity > 1 ? (
          <Text size="small" appearance="subdued">
            {i18n.translate('priceSummary.quantity', {
              quantity: i18n.formatCurrency(currentPrice, {
                currency,
                compactDisplay: 'short',
                currencyDisplay: 'narrowSymbol',
              }),
            })}
          </Text>
        ) : null}
      </BlockStack>

      <BlockStack spacing="none" inlineAlignment="end">
        <Text
          size={isDiscounted ? 'small' : 'base'}
          appearance={isDiscounted ? 'subdued' : 'base'}
          accessibilityRole={isDiscounted ? 'deletion' : undefined}
        >
          {i18n.formatCurrency(currentPrice * line.quantity, {
            currency,
            compactDisplay: 'short',
            currencyDisplay: 'narrowSymbol',
          })}
        </Text>

        {isDiscounted && (
          <Text>
            {i18n.formatCurrency(discountedPrice, {
              currency,
              compactDisplay: 'short',
              currencyDisplay: 'narrowSymbol',
            })}
          </Text>
        )}
      </BlockStack>
    </InlineLayout>
  );
}
