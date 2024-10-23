import type {SubscriptionDeliveryMethod} from '~/types/contracts';
import {
  deliveryMethodIsLocalDelivery,
  deliveryMethodIsLocalPickup,
  deliveryMethodIsShipping,
} from './typeGuards/contracts';

export function getDeliveryMethodTitle(
  deliveryMethod: SubscriptionDeliveryMethod,
) {
  if (deliveryMethodIsShipping(deliveryMethod)) {
    return deliveryMethod.shippingOption.title;
  }

  if (deliveryMethodIsLocalDelivery(deliveryMethod)) {
    return deliveryMethod.localDeliveryOption.title;
  }

  if (deliveryMethodIsLocalPickup(deliveryMethod)) {
    return deliveryMethod.pickupOption.title;
  }
}
