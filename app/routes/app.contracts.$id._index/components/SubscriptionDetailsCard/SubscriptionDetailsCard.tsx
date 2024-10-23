import {
  BlockStack,
  Card,
  Divider,
  Grid,
  Icon,
  InlineStack,
  Link,
  Text,
} from '@shopify/polaris';
import {DeliveryIcon, DiscountIcon} from '@shopify/polaris-icons';
import {useTranslation} from 'react-i18next';
import {useDeliveryFrequencyFormatter} from '~/hooks';
import type {SubscriptionContractDetails} from '~/types/contracts';
import {discountTextFromCycleDiscount} from '~/utils/helpers/contracts';
import {SubscriptionLineItem} from './components/SubscriptionLineItem/SubscriptionLineItem';
import type {OutOfStockProductVariant} from '~/types';

interface Props {
  subscriptionContract: SubscriptionContractDetails;
  outOfStockVariants: OutOfStockProductVariant[];
}

export function SubscriptionDetailsCard({
  subscriptionContract,
  outOfStockVariants,
}: Props) {
  const {t, i18n} = useTranslation('app.contracts');
  const locale = i18n.language;
  const {deliveryFrequencyText} = useDeliveryFrequencyFormatter();
  const deliveryFrequency = deliveryFrequencyText(
    subscriptionContract.deliveryPolicy,
  );

  const {lines, deliveryMethod} = subscriptionContract;

  let discountText = '';
  const firstLineDiscount = lines[0]?.pricingPolicy?.cycleDiscounts?.[0];

  if (lines.length > 1) {
    discountText = t('details.discountValue.multipleDiscounts');
  } else if (lines.length === 1 && firstLineDiscount) {
    discountText = discountTextFromCycleDiscount(firstLineDiscount, t, locale);
  }

  const localPickupText = t('details.localPickup', {
    value: deliveryFrequency,
  });

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingMd" fontWeight="semibold">
            {t('details.subscription')}
          </Text>
          <Link removeUnderline url={'./edit'}>
            {t('details.edit')}
          </Link>
        </InlineStack>
        <BlockStack gap="200">
          {lines.map((line) => {
            return (
              <SubscriptionLineItem
                key={line.id}
                line={line}
                isOutOfStock={outOfStockVariants.some(
                  (variant) => variant.id === line.variantId,
                )}
              />
            );
          })}
        </BlockStack>
        <Divider />
        <BlockStack>
          {discountText ? (
            <Grid columns={{xs: 3, sm: 3, md: 4, lg: 5, xl: 5}}>
              <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
                <InlineStack gap="100" align="start">
                  <div>
                    <Icon source={DiscountIcon} tone="base" />
                  </div>
                  <Text variant="bodyLg" tone="subdued" as="span" breakWord>
                    {t('details.discount')}
                  </Text>
                </InlineStack>
              </Grid.Cell>
              <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 3, lg: 4, xl: 4}}>
                <Text as="span">{discountText}</Text>
              </Grid.Cell>
            </Grid>
          ) : null}
          <Grid columns={{xs: 3, sm: 3, md: 4, lg: 5, xl: 5}}>
            <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
              <InlineStack gap="100" align="start">
                <div>
                  <Icon source={DeliveryIcon} tone="base" />
                </div>
                <Text variant="bodyLg" tone="subdued" as="span" breakWord>
                  {t('details.delivery')}
                </Text>
              </InlineStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 3, lg: 4, xl: 4}}>
              <Text as="span">
                {deliveryMethod?.isLocalPickup
                  ? localPickupText
                  : `${deliveryFrequency}`}
              </Text>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
