import {render} from 'preact';
import '@shopify/ui-extensions/customer-account';

import OrderStatusSubscriptionQuery from './graphql/OrderStatusSubscriptionQuery';
import {nodesFromEdges, parseGid} from '@shopify/admin-graphql-api-utilities';
import {fetchCustomerApi} from '../../shared/services/customerApi';

export default async function extension() {
  const orderId = shopify.orderId;

  try {
    const {data} = await fetchCustomerApi(OrderStatusSubscriptionQuery, {
      orderId,
    });

    const contracts = nodesFromEdges(
      data?.order?.subscriptionContracts?.edges || [],
    );

    render(
      <OrderActionMenuItemExtension contracts={contracts} />,
      document.body,
    );
  } catch (error) {
    console.error('Failed to fetch subscription contracts:', error);
    return;
  }
}

interface SubscriptionContract {
  id: string;
  status: string;
}
interface OrderActionMenuItemExtensionProps {
  contracts: SubscriptionContract[];
}

export function OrderActionMenuItemExtension({
  contracts,
}: OrderActionMenuItemExtensionProps) {
  const i18n = shopify.i18n;

  if (contracts.length === 0) {
    return null;
  }

  const firstContract = contracts[0];

  const extensionUrl =
    contracts.length > 1
      ? `extension:buyer-subscriptions/`
      : `extension:buyer-subscriptions/subscriptions/${parseGid(firstContract.id)}`;

  return (
    <s-button href={extensionUrl} variant="secondary">
      {i18n.translate(
        contracts.length > 1
          ? 'manageSubscriptions.plural'
          : 'manageSubscriptions.singular',
      )}
    </s-button>
  );
}
