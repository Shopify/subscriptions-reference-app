import {useTranslation} from 'react-i18next';
import type {PaginationInfo, RecurringPolicy} from '~/types';
import type {SellingPlanGroupListItemSellingPlan} from '~/types/plans';

export function useDeliveryFrequencyFormatter() {
  const {t} = useTranslation();

  const deliveryFrequencyText = (deliveryPolicy: RecurringPolicy): string => {
    const interval = deliveryPolicy.interval.toLowerCase();
    const count = deliveryPolicy.intervalCount;

    if (count === 1) {
      return t(`deliveryFrequency.${interval}.one`);
    } else {
      return t(`deliveryFrequency.${interval}.other`, {count});
    }
  };

  const sellingPlanDeliveryFrequencyText = (
    sellingPlans: SellingPlanGroupListItemSellingPlan[],
    sellingPlansPageInfo: PaginationInfo,
  ): string => {
    if (sellingPlansPageInfo.hasNextPage) {
      return t('deliveryFrequency.multipleDeliveryFrequenciesNoCount');
    }

    if (sellingPlans.length > 1) {
      return t('deliveryFrequency.multipleDeliveryFrequencies', {
        count: sellingPlans.length,
      });
    }

    return deliveryFrequencyText(sellingPlans[0].deliveryPolicy);
  };

  return {deliveryFrequencyText, sellingPlanDeliveryFrequencyText};
}
