import {useEffect, useCallback} from 'react';

import SubscriptionDetailsQuery from './graphql/SubscriptionDetailsQuery';

import type {SubscriptionContractQuery as SubscriptionContractQueryData} from 'generatedTypes/customer.generated';
import type {
  CustomerAddress,
  ShippingAddress,
  SubscriptionContractDetails,
  SubscriptionLine,
} from 'types';
import type {CountryCode} from 'generatedTypes/customer.types';
import {composeGid, nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import {useGraphqlApi} from 'foundation/Api';
import {getContractPriceBreakdown} from 'utilities/pricebreakdown';
type SubscriptionDeliveryMethod = NonNullable<
  SubscriptionContractQueryData['customer']['subscriptionContract']
>['deliveryMethod'];

interface Variables {
  id: string;
}

export function useSubscriptionContract({id}: {id: string}) {
  const [query, response] = useGraphqlApi<
    SubscriptionContractQueryData,
    Variables
  >();

  useEffect(() => {
    query(SubscriptionDetailsQuery, {
      id: composeGid('SubscriptionContract', id),
    });
  }, [query, id]);

  const refetchSubscriptionContract = useCallback(() => {
    query(SubscriptionDetailsQuery, {
      id: composeGid('SubscriptionContract', id),
    });
  }, [query, id]);

  return {
    ...response,
    data: formatData(response.data),
    refetchSubscriptionContract,
  };
}

function formatData(data?: SubscriptionContractQueryData):
  | {
      subscriptionContract: SubscriptionContractDetails;
    }
  | undefined {
  if (!data?.customer.subscriptionContract) return;

  const {subscriptionContract} = data.customer;

  const lastOrderPrice = subscriptionContract.orders.edges[0]?.node.totalPrice;

  const priceBreakdownEstimate = getContractPriceBreakdown({
    currencyCode: subscriptionContract.currencyCode,
    lines: nodesFromEdges(subscriptionContract.lines.edges).map((line) => ({
      lineDiscountedPrice: {
        amount: line.lineDiscountedPrice.amount,
      },
    })),
    deliveryPrice: subscriptionContract.deliveryPrice,
  });
  return {
    subscriptionContract: {
      ...subscriptionContract,
      priceBreakdownEstimate,
      deliveryMethod: subscriptionContract.deliveryMethod ?? undefined,
      lastOrderPrice,
      ...getShippingInfo(subscriptionContract.deliveryMethod),
      pickupAddress: getPickupAddress(subscriptionContract.deliveryMethod),
      upcomingBillingCycles: nodesFromEdges(
        subscriptionContract.upcomingBillingCycles.edges,
      ),
      lines: formatLines(subscriptionContract.lines),
      orders: nodesFromEdges(subscriptionContract.orders.edges),
      lastBillingAttemptErrorType:
        subscriptionContract.lastBillingAttemptErrorType,
    },
  };
}

function formatLines(
  graphqlLines: NonNullable<
    SubscriptionContractQueryData['customer']['subscriptionContract']
  >['lines'],
): SubscriptionLine[] {
  return nodesFromEdges(graphqlLines.edges).map((line) => ({
    ...line,
    image: line.image ?? undefined,
  }));
}

function getShippingInfo(deliveryMethod?: SubscriptionDeliveryMethod) {
  if (!deliveryMethod) return null;

  // presence of 'address' means delivery method is shipping or local delivery
  if ('address' in deliveryMethod) {
    return {
      shippingAddress: extractShippingAddress(deliveryMethod.address),
      shippingMethodTitle:
        'shippingOption' in deliveryMethod
          ? deliveryMethod.shippingOption.presentmentTitle
          : deliveryMethod.localDeliveryOption.presentmentTitle,
    };
  }
}

function getPickupAddress(
  deliveryMethod?: SubscriptionDeliveryMethod,
): ShippingAddress | undefined {
  if (!deliveryMethod) return;

  if ('pickupOption' in deliveryMethod) {
    const {pickupAddress} = deliveryMethod.pickupOption;
    return {
      firstName: '',
      lastName: '',
      address1: pickupAddress.address1 || '',
      address2: pickupAddress.address2 || '',
      city: pickupAddress.city || '',
      province: pickupAddress.zoneCode || '',
      zip: pickupAddress.zip || '',
      country: pickupAddress.countryCode || '',
      phone: pickupAddress.phone || '',
    };
  }
}

function extractShippingAddress(address: CustomerAddress): ShippingAddress {
  return {
    firstName: address.firstName || '',
    lastName: address.lastName || '',
    address1: address.address1 || '',
    address2: address.address2 || '',
    city: address.city || '',
    province: address.provinceCode || '',
    zip: address.zip || '',
    country: (address.countryCode as CountryCode) || '',
    phone: address.phone || '',
  };
}
