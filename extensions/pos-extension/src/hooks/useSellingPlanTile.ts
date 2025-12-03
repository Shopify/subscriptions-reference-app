import {Cart} from '@shopify/ui-extensions/point-of-sale';
import {getSubscriptionItems} from '../utils/cart';
import {useState} from 'preact/hooks';
import {PreactI18n} from '../i18n/config';
import {getPlural} from '../utils/locale';
import {isVersionSupported} from '../utils/versionComparison';
import {MINIMUM_VERSION_SUPPORTED} from '../constants/constants';

export interface SellingPlansTile {
  title: string;
  subtitle: string;
  enabled: boolean;
  disabledReason: 'feature-disabled' | 'version-unsupported' | null;
  onCartChange: (cart: Cart) => void;
}

export const useSellingPlanTile = (
  initialCart: Cart,
  i18n: PreactI18n,
  posVersion: string,
): SellingPlansTile => {
  const [subscriptionItemsCount, setSubscriptionItemsCount] = useState(
    getSubscriptionItems(initialCart).length,
  );

  const handleCartChange = (cart: Cart) => {
    setSubscriptionItemsCount(getSubscriptionItems(cart).length);
  };

  const hasSubscriptions = subscriptionItemsCount > 0;
  const versionSupported = isVersionSupported(
    posVersion,
    MINIMUM_VERSION_SUPPORTED,
  );

  const disabledReason = !versionSupported
    ? 'version-unsupported'
    : !hasSubscriptions
      ? 'feature-disabled'
      : null;

  return {
    title: versionSupported
      ? i18n.t('Tile.title')
      : i18n.t('Tile.unavailable.title'),
    subtitle: versionSupported
      ? getPlural(i18n, 'Tile.subtitle.available', subscriptionItemsCount)
      : i18n.t('Tile.unavailable.subtitle', {
          version: MINIMUM_VERSION_SUPPORTED,
        }),
    enabled: hasSubscriptions && versionSupported,
    disabledReason,
    onCartChange: handleCartChange,
  };
};
