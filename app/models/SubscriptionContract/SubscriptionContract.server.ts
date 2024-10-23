import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {
  ProductVariantPriceQuery as ProductVariantPriceQueryData,
  SubscriptionContractEditDetailsQuery as SubscriptionContractEditDetailsQueryData,
  SubscriptionContractsQueryVariables,
} from 'types/admin.generated';

import type {GraphQLClient, PaginationInfo} from '~/types';
import type {SubscriptionContractEditDetails} from '~/types/contractEditing';
import type {
  FormattedAddressWithId,
  SubscriptionContractListItem,
  SubscriptionContractDetails,
} from '~/types/contracts';

import SubscriptionContractWithBillingCycleQuery from '~/graphql/SubscriptionContractWithBillingCycleQuery';
import {unauthenticated} from '~/shopify.server';

import ProductVariantPriceQuery from '~/graphql/ProductVariantPriceQuery';
import SubscriptionContractCustomerQuery from '~/graphql/SubscriptionContractCustomerQuery';
import SubscriptionContractDetailsQuery from '~/graphql/SubscriptionContractDetailsQuery';
import SubscriptionContractEditDetailsQuery from '~/graphql/SubscriptionContractEditDetailsQuery';
import SubscriptionContractRebillingQuery from '~/graphql/SubscriptionContractRebillingQuery';
import SubscriptionContractsQuery from '~/graphql/SubscriptionContractsQuery';

import {formatCustomerAddress} from '~/utils/helpers/contracts';
import {logger} from '~/utils/logger.server';

interface FindSubscriptionContractWithBillingCycleArgs {
  shop: string;
  contractId: string;
  date: string;
}

export type SubscriptionContractWithBillingCycle = Awaited<
  ReturnType<typeof findSubscriptionContractWithBillingCycle>
>;

export type SubscriptionContractWithBillingCycleBillingAttempt =
  SubscriptionContractWithBillingCycle['subscriptionBillingCycle']['billingAttempts']['edges'][0]['node'];

export async function findSubscriptionContractWithBillingCycle({
  shop,
  contractId,
  date,
}: FindSubscriptionContractWithBillingCycleArgs) {
  const {admin} = await unauthenticated.admin(shop);

  const response = await admin.graphql(
    SubscriptionContractWithBillingCycleQuery,
    {variables: {contractId, date}},
  );

  const json = await response.json();
  const subscriptionContract = json.data?.subscriptionContract;
  const subscriptionBillingCycle = json.data?.subscriptionBillingCycle;

  if (!subscriptionContract) {
    throw new Error(
      `Failed to find SubscriptionContract with id: ${contractId}`,
    );
  }

  if (!subscriptionBillingCycle) {
    throw new Error(
      `Failed to find SubscriptionBillingCycle with contractId: ${contractId}, date: ${date}`,
    );
  }

  return {subscriptionContract, subscriptionBillingCycle};
}

export async function getContracts(
  graphql: GraphQLClient,
  variables: SubscriptionContractsQueryVariables,
): Promise<{
  subscriptionContracts: SubscriptionContractListItem[];
  subscriptionContractPageInfo: PaginationInfo;
  hasContractsWithInventoryError: boolean;
}> {
  const response = await graphql(SubscriptionContractsQuery, {
    variables,
  });

  const {data} = await response.json();

  const formattedSubscriptionContracts = nodesFromEdges(
    data?.subscriptionContracts?.edges || [],
  ).map(
    ({
      id,
      customer,
      deliveryPolicy,
      status,
      lines,
      linesCount,
      billingAttempts,
      currencyCode,
    }) => {
      const contractLines = nodesFromEdges(lines.edges || []).map((line) => ({
        ...line,
        productId: line.productId ?? undefined,
      }));

      const contractBillingAttempts = nodesFromEdges(
        billingAttempts?.edges || [],
      );

      const {subtotalPrice} = getContractPriceBreakdown({
        currencyCode,
        lines: contractLines,
      });
      return {
        id,
        customer: {displayName: customer?.displayName},
        deliveryPolicy: {
          interval: deliveryPolicy?.interval,
          intervalCount: deliveryPolicy?.intervalCount,
        },
        billingAttempts: contractBillingAttempts,
        status,
        totalPrice: subtotalPrice,
        lines: contractLines,
        lineCount: linesCount?.count ?? 0,
      };
    },
  );

  return {
    subscriptionContracts: formattedSubscriptionContracts,
    subscriptionContractPageInfo: data?.subscriptionContracts
      ?.pageInfo as PaginationInfo,
    hasContractsWithInventoryError:
      (data?.contractsWithInventoryError?.edges?.length ?? 0) > 0,
  };
}

export async function getContractDetailsForRebilling(
  graphql: GraphQLClient,
  id: string,
) {
  const response = await graphql(SubscriptionContractRebillingQuery, {
    variables: {
      id,
    },
  });

  const {data} = await response.json();
  const subscriptionContract = data?.subscriptionContract;

  if (!subscriptionContract) {
    logger.error(`Failed to find SubscriptionContract with id: ${id}`);
    throw new Error(`Failed to find SubscriptionContract with id: ${id}`);
  }

  return subscriptionContract;
}

export async function getContractDetails(
  graphql: GraphQLClient,
  id: string,
): Promise<SubscriptionContractDetails> {
  const response = await graphql(SubscriptionContractDetailsQuery, {
    variables: {
      id,
    },
  });

  const {data} = await response.json();
  const subscriptionContract = data?.subscriptionContract;

  if (!subscriptionContract) {
    throw new Error(`Failed to find SubscriptionContract with id: ${id}`);
  }

  const {
    customer,
    lines: {edges: linesEdges},
    billingAttempts: {edges: billingAttemptEdges},
    deliveryMethod,
    currencyCode,
    discounts: {edges: discountsEdges},
    deliveryPrice,
  } = subscriptionContract;

  const lines = nodesFromEdges(linesEdges);

  const {subtotalPrice, totalShippingPrice} = getContractPriceBreakdown({
    currencyCode,
    lines,
    discounts: nodesFromEdges(discountsEdges),
    deliveryPrice,
  });
  const customerAddresses = (customer?.addresses ?? [])
    .map((address) => {
      return {
        id: address.id,
        address: formatCustomerAddress(address),
      };
    })
    .filter(
      (address): address is FormattedAddressWithId => address.address !== null,
    );

  const billingAttempts = nodesFromEdges(billingAttemptEdges);

  return {
    ...subscriptionContract,
    customer: customer
      ? {
          ...customer,
          addresses: customerAddresses,
        }
      : undefined,
    deliveryMethod: deliveryMethod
      ? {
          ...deliveryMethod,
          name: deliveryMethod.__typename,
          isLocalPickup:
            deliveryMethod.__typename === 'SubscriptionDeliveryMethodPickup',
        }
      : undefined,
    lines,
    billingAttempts,
    priceBreakdownEstimate: {
      subtotalPrice,
      totalShippingPrice,
    },
  };
}

export async function getContractEditDetails(
  graphql: GraphQLClient,
  id: string,
): Promise<SubscriptionContractEditDetails> {
  const response = await graphql(SubscriptionContractEditDetailsQuery, {
    variables: {
      id,
    },
  });

  const {data} = (await response.json()) as {
    data: SubscriptionContractEditDetailsQueryData;
  };

  if (!data || !data.subscriptionContract) {
    throw new Error(`Failed to find SubscriptionContract with id: ${id}`);
  }

  const {subscriptionContract} = data;
  const {
    deliveryMethod,
    deliveryPolicy,
    currencyCode,
    discounts: {edges: discountsEdges},
    deliveryPrice,
  } = subscriptionContract;

  const lines = await Promise.all(
    nodesFromEdges(subscriptionContract.lines.edges).map(async (line) => ({
      ...line,
      currentOneTimePurchasePrice: line.variantId
        ? await getProductVariantPrice(graphql, line.variantId)
        : undefined,
    })),
  );

  const {subtotalPrice, totalShippingPrice} = getContractPriceBreakdown({
    currencyCode,
    lines,
    discounts: nodesFromEdges(discountsEdges),
    deliveryPrice,
  });
  return {
    ...subscriptionContract,
    lines,
    deliveryMethod: deliveryMethod
      ? {
          ...deliveryMethod,
          name: deliveryMethod?.__typename,
          isLocalPickup:
            deliveryMethod?.__typename === 'SubscriptionDeliveryMethodPickup',
        }
      : undefined,
    deliveryPolicy: {
      intervalCount: deliveryPolicy.intervalCount,
      interval: deliveryPolicy.interval,
    },
    priceBreakdownEstimate: {
      subtotalPrice,
      totalShippingPrice,
    },
  };
}

export async function getContractCustomerId(
  shopDomain: string,
  subscriptionContractId: string,
): Promise<string> {
  const {admin} = await unauthenticated.admin(shopDomain);
  const response = await admin.graphql(SubscriptionContractCustomerQuery, {
    variables: {
      id: subscriptionContractId,
    },
  });

  const json = await response.json();
  const customerId = json.data?.subscriptionContract?.customer?.id;

  if (!customerId) {
    logger.error(
      {shopDomain, json},
      'Missing customerId whilst running getContractCustomerId',
    );
    throw new Error('Missing customerId whilst running getContractCustomerId');
  }

  return customerId;
}

export async function getProductVariantPrice(
  graphql: GraphQLClient,
  productVariantId: string,
): Promise<number> {
  const response = await graphql(ProductVariantPriceQuery, {
    variables: {
      id: productVariantId,
    },
  });

  const {data} = (await response.json()) as {
    data?: ProductVariantPriceQueryData;
  };
  const price = data?.productVariant?.price;

  return price ?? -1;
}

interface ContractPriceBreakdownArgs {
  currencyCode: string;
  lines: {
    lineDiscountedPrice: {
      amount: number;
    };
  }[];
  discounts?: {
    targetType: string;
  }[];
  deliveryPrice?: {
    amount: number;
  };
}

function getContractPriceBreakdown({
  currencyCode,
  lines,
  discounts = [],
  deliveryPrice = {amount: 0},
}: ContractPriceBreakdownArgs) {
  const subtotalAmount = lines.reduce(
    (acc, line) => acc + Number(line.lineDiscountedPrice.amount),
    0,
  );

  const subtotalPrice = {
    amount: subtotalAmount,
    currencyCode,
  };

  const hasShippingDiscount = discounts.some((discount) => {
    return discount.targetType === 'SHIPPING_LINE';
  });

  const totalShippingPrice = {
    amount: hasShippingDiscount ? 0 : deliveryPrice.amount,
    currencyCode,
  };

  return {
    subtotalPrice,
    totalShippingPrice,
  };
}
