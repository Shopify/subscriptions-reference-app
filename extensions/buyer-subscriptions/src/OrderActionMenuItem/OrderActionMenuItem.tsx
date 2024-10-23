import {useEffect} from 'react';
import {
  Button,
  reactExtension,
} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';
import type {
  OrderStatusSubscriptionQuery as OrderStatusSubscriptionQueryData,
  OrderStatusSubscriptionQueryVariables,
} from 'generatedTypes/customer.generated';

import OrderStatusSubscriptionQuery from './graphql/OrderStatusSubscriptionQuery';
import {nodesFromEdges, parseGid} from '@shopify/admin-graphql-api-utilities';
import type {BuyerSubscriptionsExtensionTarget} from 'foundation/Api/useExtensionApi';

export default reactExtension(
  'customer-account.order.action.menu-item.render',
  async () => {
    return <OrderActionMenuItemExtension />;
  },
);

export function OrderActionMenuItemExtension() {
  const {orderId, i18n} =
    useExtensionApi<BuyerSubscriptionsExtensionTarget.OrderActionMenuItem>();

  const [query, response] = useGraphqlApi<
    OrderStatusSubscriptionQueryData,
    OrderStatusSubscriptionQueryVariables
  >();

  useEffect(() => {
    query(OrderStatusSubscriptionQuery, {orderId});
  }, [query, orderId]);

  const subscriptionContracts = nodesFromEdges(
    response.data?.order?.subscriptionContracts?.edges || [],
  );

  if (subscriptionContracts.length === 0) {
    return null;
  }

  const firstContract = subscriptionContracts[0];

  const extensionUrl =
    subscriptionContracts.length > 1
      ? `extension:buyer-subscriptions/`
      : `extension:buyer-subscriptions/subscriptions/${parseGid(firstContract.id)}`;

  return (
    <Button to={extensionUrl}>
      {i18n.translate(
        subscriptionContracts.length > 1
          ? 'manageSubscriptions.plural'
          : 'manageSubscriptions.singular',
      )}
    </Button>
  );
}
