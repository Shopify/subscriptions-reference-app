import {useTranslation} from 'react-i18next';
import type {
  SubscriptionContractLine,
  SubscriptionContractListItemLine,
} from '~/types/contracts';
import type {SellingPlanGroupListItemProduct} from '~/types/plans';

export function useProductCountFormatter() {
  const {t} = useTranslation();

  const getProductCountText = (
    products?:
      | SellingPlanGroupListItemProduct[]
      | SubscriptionContractLine[]
      | SubscriptionContractListItemLine[],
    productsCount: number = 0,
    productVariantsCount: number = 0,
  ): string => {
    if (productsCount === 1) {
      return products![0].title;
    }

    if (productsCount > 1) {
      return t('productAndVariants.productsCount', {count: productsCount});
    }

    if (productVariantsCount > 0) {
      return t('productAndVariants.variantsCount', {
        count: productVariantsCount,
      });
    }

    return t('productAndVariants.noProduct');
  };

  return getProductCountText;
}
