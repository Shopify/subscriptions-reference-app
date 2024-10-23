import {useTranslation} from 'react-i18next';
import type {PaginationInfo} from '~/types';
import {
  SellingPlanAdjustment,
  type SellingPlanGroupListItemSellingPlan,
} from '~/types/plans';
import {PricingPolicyAdjustmentValueIsPercentage} from '~/utils/typeGuards/sellingPlans';
import {formatPrice} from '~/utils/helpers/money';

export function usePricingPolicyFormatter() {
  const {t, i18n} = useTranslation();
  const locale = i18n.language;

  const getSellingPlanDiscounts = (
    sellingPlans: SellingPlanGroupListItemSellingPlan[],
    sellingPlansPageInfo: PaginationInfo,
  ) => {
    if (sellingPlansPageInfo.hasNextPage) {
      return t('pricingPolicy.multipleDiscounts');
    }

    const discounts = sellingPlans
      .filter((sellingPlan) => sellingPlan.pricingPolicies?.length)
      .map(({pricingPolicies}) => {
        const firstPricingPolicy = pricingPolicies![0];
        return {
          adjustmentType: firstPricingPolicy.adjustmentType,
          adjustmentValue: PricingPolicyAdjustmentValueIsPercentage(
            firstPricingPolicy.adjustmentValue,
          )
            ? {
                percentage: firstPricingPolicy.adjustmentValue.percentage,
              }
            : {
                amount: firstPricingPolicy.adjustmentValue.amount,
                currencyCode: firstPricingPolicy.adjustmentValue.currencyCode,
              },
        };
      });

    if (!discounts?.length) {
      return t('pricingPolicy.noDiscount');
    }

    const discountValues = discounts.map((discount) =>
      PricingPolicyAdjustmentValueIsPercentage(discount.adjustmentValue)
        ? discount.adjustmentValue.percentage
        : discount.adjustmentValue.amount,
    );
    const minDiscount = Math.min(...discountValues);
    const maxDiscount = Math.max(...discountValues);

    switch (discounts[0].adjustmentType) {
      case SellingPlanAdjustment.Percentage:
        const discountTextPercentage =
          minDiscount === maxDiscount
            ? `${minDiscount}`
            : `${minDiscount}-${maxDiscount}`;
        return t('pricingPolicy.percentageOff', {
          amount: discountTextPercentage,
        });
      case SellingPlanAdjustment.Fixed:
        const minDiscountFixed = formatPrice({
          amount: minDiscount,
          currency: discounts[0].adjustmentValue.currencyCode,
          locale,
        });
        const maxDiscountFixed = formatPrice({
          amount: maxDiscount,
          currency: discounts[0].adjustmentValue.currencyCode,
          locale,
        });
        const discountTextFixed =
          minDiscountFixed === maxDiscountFixed
            ? `${minDiscountFixed}`
            : `${minDiscountFixed}-${maxDiscountFixed}`;
        return t('pricingPolicy.amountOff', {amount: discountTextFixed});
      case SellingPlanAdjustment.Price:
        const minDiscountPrice = formatPrice({
          amount: minDiscount,
          currency: discounts[0].adjustmentValue.currencyCode,
          locale,
        });
        const maxDiscountPrice = formatPrice({
          amount: maxDiscount,
          currency: discounts[0].adjustmentValue.currencyCode,
          locale,
        });
        const discountTextPrice =
          minDiscountPrice === maxDiscountPrice
            ? `${minDiscountPrice}`
            : `${minDiscountPrice}-${maxDiscountPrice}`;
        return t('pricingPolicy.fixedPrice', {amount: discountTextPrice});
      default:
        return t('pricingPolicy.noDiscount');
    }
  };

  return getSellingPlanDiscounts;
}
