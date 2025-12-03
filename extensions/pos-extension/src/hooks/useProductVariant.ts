import {useEffect, useState} from 'preact/hooks';
import type {
  ProductSearchApiContent,
  ProductVariant,
} from '@shopify/ui-extensions/point-of-sale';
import {
  AsyncState,
  createIdleState,
  createLoadingState,
  createSuccessState,
  createErrorState,
} from '../utils/asyncState';

export type UseProductVariantState = AsyncState<ProductVariant>;

export function useProductVariant(
  variantId: number | undefined,
  productSearch: ProductSearchApiContent,
): UseProductVariantState {
  const [state, setState] = useState<UseProductVariantState>(createIdleState());

  useEffect(() => {
    if (!variantId) {
      setState(createIdleState());
      return;
    }

    const fetchVariant = async () => {
      setState(createLoadingState());

      try {
        const variant =
          await productSearch.fetchProductVariantWithId(variantId);

        if (!variant) {
          throw new Error('Variant not found');
        }

        setState(createSuccessState(variant));
      } catch (error) {
        setState(
          createErrorState(
            error instanceof Error ? error.message : 'Failed to fetch variant',
          ),
        );
      }
    };

    fetchVariant();
  }, [variantId, productSearch]);

  return state;
}
