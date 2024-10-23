import {BlockStack, Button, Card, Text} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {useFieldArray, useFormContext} from '@rvf/remix';
import {v4 as uuidv4} from 'uuid';
import {
  NEW_DELIVERY_OPTION_ID,
  defaultDiscountDeliveryOption,
} from '~/routes/app.plans.$id/utils';
import type {
  DiscountDeliveryOption,
  DiscountTypeType,
} from '~/routes/app.plans.$id/validator';
import {DiscountType} from '~/routes/app.plans.$id/validator';

import {Checkbox} from '~/components/Checkbox';
import {RadioButton} from '~/components/RadioButton';
import {useShopInfo} from '~/context/ShopContext';
import {DiscountDeliveryOptionLine} from './components/DiscountDeliveryOptionLine';

interface DiscountDeliveryCardProps {
  discountDeliveryOptions: DiscountDeliveryOption[];
}

export function DiscountDeliveryCard({
  discountDeliveryOptions,
}: DiscountDeliveryCardProps) {
  const {t} = useTranslation('app.plans.details');
  const form = useFormContext<{
    offerDiscount: boolean;
    discountType: DiscountTypeType;
    discountDeliveryOptions: DiscountDeliveryOption[];
  }>();
  const {currencyCode} = useShopInfo();

  const discountDeliveryOptionsField = useFieldArray(
    form.scope('discountDeliveryOptions'),
  );
  const canRemoveOption = discountDeliveryOptionsField.length() > 1;

  const sellingPlansIdsToDelete = discountDeliveryOptions
    .map((option) => option.id)
    .filter((id) => {
      let deleted = true;
      discountDeliveryOptionsField.map((_, o) => {
        if (o.value('id') === id) {
          deleted = false;
        }
        return null;
      });

      return deleted;
    });

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {t('discountDeliveryCard.title')}
        </Text>
        <Checkbox
          label={t('discountDeliveryCard.offerDiscount')}
          name="offerDiscount"
        />
        <input type="hidden" name="shopCurrencyCode" value={currencyCode} />
        {sellingPlansIdsToDelete.length > 0 ? (
          <input
            type="hidden"
            name="sellingPlanIdsToDelete"
            value={sellingPlansIdsToDelete.join(',')}
          />
        ) : null}
        {Boolean(form.value('offerDiscount')) && (
          <BlockStack>
            <RadioButton
              name="discountType"
              value={DiscountType.PERCENTAGE}
              label={t('discountDeliveryCard.discountType.percentageOff')}
            />
            <RadioButton
              name="discountType"
              value={DiscountType.FIXED_AMOUNT}
              label={t('discountDeliveryCard.discountType.amountOff')}
            />
            <RadioButton
              name="discountType"
              value={DiscountType.PRICE}
              label={t('discountDeliveryCard.discountType.fixedPrice')}
            />
          </BlockStack>
        )}
        {discountDeliveryOptionsField.map((_, option, index) => {
          return (
            <DiscountDeliveryOptionLine
              id={option.value('id')}
              key={`${option.value('id')}_discount-delivery-option_${index}`}
              index={index}
              discountType={form.value('discountType')}
              remove={
                canRemoveOption
                  ? async () => await discountDeliveryOptionsField.remove(index)
                  : undefined
              }
              offerDiscount={Boolean(form.value('offerDiscount'))}
              shopCurrencyCode={currencyCode}
            />
          );
        })}
        <div>
          <Button
            onClick={async () =>
              await discountDeliveryOptionsField.push({
                ...defaultDiscountDeliveryOption,
                id: `${NEW_DELIVERY_OPTION_ID}--${uuidv4()}`,
              })
            }
          >
            {t('discountDeliveryCard.addOption')}
          </Button>
        </div>
      </BlockStack>
    </Card>
  );
}
