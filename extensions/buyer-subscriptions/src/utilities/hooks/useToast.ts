import {useExtensionApi} from 'foundation/Api';

export enum SuccessToastType {
  Paused = 'paused',
  Resumed = 'resumed',
  Cancelled = 'cancelled',
  Skipped = 'skipped',
  PaymentUpdated = 'paymentUpdated',
  ShippingUpdated = 'shippingUpdated',
  DeliveryUpdated = 'deliveryUpdated',
  Hidden = 'hidden',
}

export interface SuccessToastProps {
  type: SuccessToastType;
}

export function useToast() {
  const {
    i18n,
    ui: {toast},
  } = useExtensionApi();

  function showSuccessToast(type: SuccessToastType) {
    const title = i18n.translate(`successBanner.${type}`);

    toast.show(title);
  }

  return {showSuccessToast};
}
