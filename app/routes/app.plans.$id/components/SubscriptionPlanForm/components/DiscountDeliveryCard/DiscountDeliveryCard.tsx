import {BlockStack, Button, Card, RadioButton, Text} from '@shopify/polaris';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useControlField, useField, useFieldArray} from 'remix-validated-form';
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
import {useShopInfo} from '~/context/ShopContext';
import {DiscountDeliveryOptionLine} from './components/DiscountDeliveryOptionLine';

export function DiscountDeliveryCard() {
  const {t} = useTranslation('app.plans.details');
  const [offerDiscount] = useControlField<string>('offerDiscount');
  const {getInputProps} = useField('discountType');
  const {currencyCode} = useShopInfo();
  const [discountType, setDiscountType] =
    useControlField<DiscountTypeType>('discountType');

  const [discountDeliveryOptions, {push, remove}] =
    useFieldArray<DiscountDeliveryOption>('discountDeliveryOptions');
  const canRemoveOption = discountDeliveryOptions.length > 1;

  const [sellingPlansIdsToDelete, setSellingPlansIdsToDelete] = useState<
    string[]
  >([]);

  function handleRemoveOption(index: number, id?: string) {
    remove(index);

    if (id) {
      setSellingPlansIdsToDelete((ids) => [...ids, id]);
    }
  }

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
        {Boolean(offerDiscount) && (
          <BlockStack>
            <RadioButton
              {...getInputProps({
                id: DiscountType.PERCENTAGE,
                label: t('discountDeliveryCard.discountType.percentageOff'),
                value: DiscountType.PERCENTAGE,
                onChange: () => setDiscountType(DiscountType.PERCENTAGE),
                checked: discountType === DiscountType.PERCENTAGE,
              })}
            />
            <RadioButton
              {...getInputProps({
                id: DiscountType.FIXED_AMOUNT,
                label: t('discountDeliveryCard.discountType.amountOff'),
                value: DiscountType.FIXED_AMOUNT,
                onChange: () => setDiscountType(DiscountType.FIXED_AMOUNT),
                checked: discountType === DiscountType.FIXED_AMOUNT,
              })}
            />
            <RadioButton
              {...getInputProps({
                id: DiscountType.PRICE,
                label: t('discountDeliveryCard.discountType.flatRate'),
                value: DiscountType.PRICE,
                onChange: () => setDiscountType(DiscountType.PRICE),
                checked: discountType === DiscountType.PRICE,
              })}
            />
          </BlockStack>
        )}
        {discountDeliveryOptions.map((option, index) => {
          return (
            <DiscountDeliveryOptionLine
              id={option.defaultValue.id}
              key={`${option.defaultValue.id}_discount-delivery-option_${index}`}
              index={index}
              discountType={discountType}
              remove={
                canRemoveOption
                  ? () => handleRemoveOption(index, option.defaultValue.id)
                  : undefined
              }
              offerDiscount={Boolean(offerDiscount)}
              shopCurrencyCode={currencyCode}
            />
          );
        })}
        <div>
          <Button
            onClick={() =>
              push({
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
