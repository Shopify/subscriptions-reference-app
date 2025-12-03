import {parseGid} from '@shopify/admin-graphql-api-utilities';

import type {
  SellingPlanGroupWithPlans,
  PricingPolicy,
  SellingPlan,
} from '../types';
import {querySellingPlans} from '../foundation/api/useGraphqlQuery';
import type {AsyncState} from '../utils/asyncState';
import {
  isLoading as isLoadingState,
  isError as isErrorState,
  isSuccess as isSuccessState,
} from '../utils/asyncState';
import type {GetSellingPlansQuery} from '../../types/admin.generated';
import {useEffect, useState, useCallback} from 'preact/hooks';

import {YOUR_APP_ID} from '../constants/constants';
// Extract types from the generated query
type QuerySellingPlan = NonNullable<
  GetSellingPlansQuery['productVariant']
>['sellingPlanGroups']['edges'][0]['node']['sellingPlans']['nodes'][0];
type QueryPricingPolicy = QuerySellingPlan['pricingPolicies'][0];

export type UseSellingPlansState = AsyncState<SellingPlanGroupWithPlans[]>;

export type UseSellingPlans = {
  sellingPlansState: UseSellingPlansState;
  fetchSellingPlans: () => void;
};

export const isLoading = (state: UseSellingPlansState) => isLoadingState(state);

export const isError = (state: UseSellingPlansState) => isErrorState(state);

export const isSuccess = (state: UseSellingPlansState) => isSuccessState(state);

export function useSellingPlans(
  variantId: number | undefined,
): UseSellingPlans {
  const [state, setState] = useState<UseSellingPlansState>({status: 'idle'});

  const fetchSellingPlans = useCallback(async () => {
    /** Development-time check: validates that your app ID is configured correctly.
     * Please remove this check once you've verified your app ID is correct.
     */
    if (YOUR_APP_ID.includes('YOUR_APP_ID_HERE')) {
      setState({
        status: 'error',
        error:
          'Please replace "YOUR_APP_ID_HERE" with your actual Shopify app ID in src/constants/constants.ts.',
      });
      return;
    }
    if (!variantId) {
      setState({status: 'idle'});
      return;
    }

    setState({status: 'loading'});

    try {
      const result = await querySellingPlans(variantId);

      if (result.errors && result.errors.length > 0) {
        setState({
          status: 'error',
          error: result.errors[0].message || 'GraphQL error occurred',
        });
        return;
      }

      const productVariant = result.data.productVariant;

      if (!productVariant) {
        setState({
          status: 'error',
          error: 'Product variant not found',
        });
        return;
      }

      const groups: SellingPlanGroupWithPlans[] =
        productVariant.sellingPlanGroups.edges.reduce<
          SellingPlanGroupWithPlans[]
        >((acc, edge) => {
          // Filter selling plans by your app's ID.
          if (edge.node.appId === YOUR_APP_ID) {
            acc.push({
              name: edge.node.name,
              plans: mapRemoteSellingPlans(edge.node.sellingPlans.nodes),
            });
          }
          return acc;
        }, []);

      setState({
        status: 'success',
        data: groups,
      });
    } catch (error) {
      setState({
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch selling plans',
      });
    }
  }, [variantId]);

  useEffect(() => {
    fetchSellingPlans();
  }, [variantId, fetchSellingPlans]);

  return {sellingPlansState: state, fetchSellingPlans};
}

export const mapRemoteSellingPlans = (
  planNodes: QuerySellingPlan[],
): SellingPlan[] => {
  return planNodes.reduce<SellingPlan[]>((plans, node) => {
    if (!node.id || node.category !== 'SUBSCRIPTION') {
      return plans;
    }

    const id = Number(parseGid(node.id));
    const sellingPlan: SellingPlan = {
      id,
      name: node.name,
      pricingPolicy: mapRemotePricingPolicies(node.pricingPolicies),
    };

    return id ? plans.concat(sellingPlan) : plans;
  }, []);
};

export const mapRemotePricingPolicies = (
  pricingPolicies: QueryPricingPolicy[],
): PricingPolicy | null => {
  // Take only the first pricing policy if it exists
  if (!pricingPolicies.length) {
    return null;
  }

  const firstPolicy = pricingPolicies[0];

  switch (firstPolicy.adjustmentValue.__typename) {
    case 'MoneyV2':
      return {
        type: firstPolicy.adjustmentType,
        value: {
          amount: firstPolicy.adjustmentValue.amount,
          currencyCode: firstPolicy.adjustmentValue.currencyCode,
        },
      };
    case 'SellingPlanPricingPolicyPercentageValue':
      return {
        type: firstPolicy.adjustmentType,
        value: {
          percentage: firstPolicy.adjustmentValue.percentage,
        },
      };
    default:
      return null;
  }
};
