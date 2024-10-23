import {useCallback, useEffect} from 'react';

import SubscriptionListQuery from './graphql/SubscriptionListQuery';

import type {
  SubscriptionListQuery as SubscriptionListQueryData,
  SubscriptionListQueryVariables,
} from 'generatedTypes/customer.generated';
import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import {useGraphqlApi} from 'foundation/Api';
import {getContractPriceBreakdown} from 'utilities/pricebreakdown';
export function useSubscriptionListData() {
  const [query, response] = useGraphqlApi<
    SubscriptionListQueryData,
    SubscriptionListQueryVariables
  >();

  useEffect(() => {
    query(SubscriptionListQuery, {
      first: 20,
    });
  }, [query]);

  const refetchSubscriptionListData = useCallback(() => {
    query(SubscriptionListQuery, {
      first: 20,
    });
  }, [query]);

  return {
    ...response,
    data: formatData(response.data),
    refetchSubscriptionListData,
  };
}

function formatData(data?: SubscriptionListQueryData) {
  if (!data) return undefined;

  return {
    subscriptionContracts: nodesFromEdges(
      data.customer.subscriptionContracts.edges,
    ).map((subscriptionContract) => {
      const lines = nodesFromEdges(subscriptionContract.lines.edges);
      const lastOrderPrice =
        subscriptionContract.orders.edges[0]?.node.totalPrice;
      const totalQuantity = lines.reduce(
        (total, line) => total + line.quantity,
        0,
      );

      const priceBreakdownEstimate = getContractPriceBreakdown({
        currencyCode: subscriptionContract.currencyCode,
        lines,
        deliveryPrice: subscriptionContract.deliveryPrice,
      });
      return {
        ...subscriptionContract,
        totalQuantity,
        lastOrderPrice,
        lines,
        upcomingBillingCycles: nodesFromEdges(
          subscriptionContract.upcomingBillingCycles.edges,
        ),
        priceBreakdownEstimate,
      };
    }),
  };
}
