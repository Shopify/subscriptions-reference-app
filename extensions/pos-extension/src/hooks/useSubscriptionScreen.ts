import {
  CartApiContent,
  LineItem,
  ProductSearchApiContent,
  SessionApiContent,
} from '@shopify/ui-extensions/point-of-sale';
import {SellingPlan} from '../types';
import {useSellingPlans} from './useSellingPlans';
import {useProductVariant} from './useProductVariant';
import {formatPrice} from '../utils/currencyFormatter';
import {useState} from 'preact/hooks';
import {isSuccess} from '../utils/asyncState';

const useSubscriptionScreen = (
  lineItem: LineItem | undefined,
  cartApi: CartApiContent,
  productSearch: ProductSearchApiContent,
  session: SessionApiContent,
) => {
  const [selectedPlan, setSelectedPlan] = useState<SellingPlan | undefined>(
    lineItem?.sellingPlan,
  );

  const variantId = lineItem?.variantId;

  const {sellingPlansState, fetchSellingPlans} = useSellingPlans(variantId);
  const variantState = useProductVariant(variantId, productSearch);

  const handleApplyPress = async () => {
    if (!lineItem) {
      return;
    }

    // Derive effective plan: use first plan if required and none selected
    const effectivePlan =
      selectedPlan ??
      (lineItem.requiresSellingPlan && isSuccess(sellingPlansState)
        ? sellingPlansState.data[0]?.plans[0]
        : undefined);

    try {
      if (effectivePlan) {
        await cartApi.addLineItemSellingPlan({
          lineItemUuid: lineItem.uuid,
          sellingPlanId: effectivePlan.id,
          sellingPlanName: effectivePlan.name,
        });
      } else {
        await cartApi.removeLineItemSellingPlan(lineItem.uuid);
      }

      window.close();
    } catch (error) {
      // Re-throw the error so the UI can handle it appropriately
      throw error;
    }
  };

  const oneTimePurchasePrice =
    lineItem?.price !== undefined
      ? formatPrice(lineItem.price, session.currentSession.currency)
      : undefined;

  return {
    sellingPlansState,
    variantState,
    selectedPlan,
    setSelectedPlan,
    handleApplyPress,
    oneTimePurchasePrice,
    fetchSellingPlans,
  };
};

export default useSubscriptionScreen;
