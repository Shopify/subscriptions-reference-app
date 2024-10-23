import {List} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {useFormContext} from '@rvf/remix';
import {useShopInfo} from '~/context/ShopContext';
import type {
  DiscountDeliveryOption,
  DiscountTypeType,
} from '~/routes/app.plans.$id/validator';
import {DiscountType} from '~/routes/app.plans.$id/validator';
import {formatPrice} from '~/utils/helpers/money';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';

export function DeliverySummary() {
  const {t, i18n} = useTranslation('app.plans.details');
  const locale = i18n.language;
  const {currencyCode: shopCurrencyCode} = useShopInfo();
  const form = useFormContext<{
    discountType: DiscountTypeType;
    offerDiscount: string;
    discountDeliveryOptions: DiscountDeliveryOption[];
  }>();

  const discountDeliveryOptions = form.value('discountDeliveryOptions');
  let deliveryFrequencyText = '';

  if (
    discountDeliveryOptions.length === 1 &&
    !discountDeliveryOptions[0].deliveryFrequency
  ) {
    return;
  }

  if (discountDeliveryOptions.length === 1) {
    const {deliveryFrequency, deliveryInterval, discountValue} =
      discountDeliveryOptions[0];
    let discountText = '';

    const deliveryTranslationKey = (() => {
      switch (deliveryInterval) {
        case DeliveryFrequencyInterval.Month:
          return 'summaryCard.monthlyDelivery';
        case DeliveryFrequencyInterval.Year:
          return 'summaryCard.yearlyDelivery';
        default:
          return 'summaryCard.weeklyDelivery';
      }
    })();

    const deliveryText = t(deliveryTranslationKey, {
      count: Number(deliveryFrequency),
      intervalCount: deliveryFrequency,
    });

    if (discountValue && form.value('offerDiscount')) {
      switch (form.value('discountType')) {
        case DiscountType.FIXED_AMOUNT:
          discountText = t('summaryCard.amountOff', {
            amount: formatPrice({
              currency: shopCurrencyCode,
              amount: discountValue,
              locale,
            }),
          });
          break;
        case DiscountType.PERCENTAGE:
          discountText = t('summaryCard.percentageOff', {
            amount: discountValue,
          });
          break;
        case DiscountType.PRICE:
          discountText = t('summaryCard.fixedPrice', {
            amount: formatPrice({
              currency: shopCurrencyCode,
              amount: discountValue,
              locale,
            }),
          });
          break;
        default:
          break;
      }
    }

    deliveryFrequencyText = discountText
      ? t('summaryCard.deliveryFrequenciesWithDiscount', {
          deliveryText,
          discountText,
        })
      : deliveryText;
  } else {
    deliveryFrequencyText = t('summaryCard.multipleDeliveryFrequencies', {
      count: discountDeliveryOptions.length,
    });
  }

  return <List.Item>{deliveryFrequencyText}</List.Item>;
}
