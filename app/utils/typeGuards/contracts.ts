import type {
  LocalDelivery,
  LocalPickup,
  ShippingDelivery,
  SubscriptionDeliveryMethod,
} from '~/types/contracts';

export function deliveryMethodIsShipping(
  deliveryMethod: SubscriptionDeliveryMethod,
): deliveryMethod is ShippingDelivery {
  return deliveryMethod ? 'shippingOption' in deliveryMethod : false;
}

export function deliveryMethodIsLocalDelivery(
  deliveryMethod: SubscriptionDeliveryMethod,
): deliveryMethod is LocalDelivery {
  return deliveryMethod ? 'localDeliveryOption' in deliveryMethod : false;
}

export function deliveryMethodIsLocalPickup(
  deliveryMethod: SubscriptionDeliveryMethod,
): deliveryMethod is LocalPickup {
  return deliveryMethod ? 'pickupOption' in deliveryMethod : false;
}
