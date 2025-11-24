import {useEffect, useState} from 'preact/hooks';
import {
  AsyncState,
  createIdleState,
  createLoadingState,
  createSuccessState,
  createErrorState,
} from '../utils/asyncState';
import {
  Cart,
  LineItem,
  ProductSearchApiContent,
  ProductVariant,
} from '@shopify/ui-extensions/point-of-sale';
import {
  getSubscriptionItems,
  getProductNameFromVariant,
  getVariantName,
  getVariantImage,
} from '../utils/cart';
import {PreactI18n} from '../i18n/config';

export interface EligibleLineItem {
  productName: string;
  variantName?: string;
  subtitle: {
    text: string;
    focused: boolean;
  };
  image?: string;
  hasSellingPlan: boolean;
  data: LineItem;
}

export interface UseEligibleProductsState {
  state: AsyncState<EligibleLineItem[]>;
  onCartChange: (cart: Cart) => void;
}

export const useEligibleLineItems = (
  initialCart: Cart,
  productSearch: ProductSearchApiContent,
  i18n: PreactI18n,
): UseEligibleProductsState => {
  const [subscriptionItems, setSubscriptionItems] = useState(
    getSubscriptionItems(initialCart),
  );

  const handleCartChange = (cart: Cart) => {
    const newSubscriptionItems = getSubscriptionItems(cart);
    setSubscriptionItems(newSubscriptionItems);
  };

  const [state, setState] =
    useState<AsyncState<EligibleLineItem[]>>(createIdleState());

  useEffect(() => {
    const sync = async () => {
      setState(createLoadingState());
      try {
        const lineItems = await getEligibleLineItems(
          subscriptionItems,
          productSearch,
          i18n,
        );
        setState(createSuccessState(lineItems));
      } catch (error) {
        setState(
          createErrorState(
            error instanceof Error
              ? error.message
              : 'Failed to process eligible line items',
          ),
        );
      }
    };
    sync();
  }, [subscriptionItems, productSearch, i18n]);

  return {
    state: state,
    onCartChange: handleCartChange,
  };
};

const getEligibleLineItems = async (
  subscriptionItems: LineItem[],
  productSearch: ProductSearchApiContent,
  i18n: PreactI18n,
): Promise<EligibleLineItem[]> => {
  const fetchedVariants = await productSearch.fetchProductVariantsWithIds(
    subscriptionItems
      .map((item) => item.variantId)
      .filter((id) => id !== undefined),
  );

  const fetchedVariantsMap = new Map(
    fetchedVariants.fetchedResources.map((variant) => [variant.id, variant]),
  );

  return subscriptionItems.map((item) => {
    const fetchedVariant = fetchedVariantsMap.get(item.variantId ?? 0);
    return populateEligibleLineItem(item, fetchedVariant, i18n);
  });
};

const populateEligibleLineItem = (
  cartLineItem: LineItem,
  fetchedVariant: ProductVariant | undefined,
  i18n: PreactI18n,
): EligibleLineItem => {
  const hasSellingPlan = cartLineItem.sellingPlan !== undefined;
  const requiresSellingPlan = cartLineItem.requiresSellingPlan ?? false;

  let subtitle = '';
  let subtitleFocused = false;

  if (hasSellingPlan) {
    subtitle = cartLineItem.sellingPlan?.name ?? '';
  } else {
    subtitle = requiresSellingPlan
      ? i18n.t('ElegibleLineItems.row.subtitle.purchasePlanRequired')
      : i18n.t('ElegibleLineItems.row.subtitle.purchasePlanAvailable');
    subtitleFocused = requiresSellingPlan;
  }

  return {
    productName: getProductNameFromVariant(fetchedVariant, cartLineItem),
    variantName: getVariantName(fetchedVariant),
    subtitle: {
      text: subtitle,
      focused: subtitleFocused,
    },
    image: getVariantImage(fetchedVariant),
    hasSellingPlan: hasSellingPlan,
    data: cartLineItem,
  };
};
