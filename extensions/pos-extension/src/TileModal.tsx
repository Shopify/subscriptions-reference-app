import {render} from 'preact';
import {EligibleLineItemsScreen} from './screens/EligibleLineItemsScreen';
import {SubscriptionScreen} from './screens/SubscriptionScreen';
import {getSubscriptionItems} from './utils/cart';
import {LineItem} from '@shopify/ui-extensions/point-of-sale';
import i18n from './i18n/config';
import I18nProvider from './components/I18nProvider';

const TileModal = () => {
  const {url: targetScreen, getState} = navigation?.currentEntry;

  if (targetScreen === 'subscription') {
    const state = getState() as {lineItem: LineItem};
    return (
      <SubscriptionScreen
        lineItem={state.lineItem}
        cartApi={shopify.cart}
        productSearch={shopify.productSearch}
        session={shopify.session}
        i18n={i18n}
      />
    );
  }

  const cart = shopify.cart.current.value;
  const subscriptionItems = getSubscriptionItems(cart);

  if (subscriptionItems.length === 1) {
    return (
      <SubscriptionScreen
        lineItem={subscriptionItems[0]}
        cartApi={shopify.cart}
        productSearch={shopify.productSearch}
        session={shopify.session}
        i18n={i18n}
      />
    );
  } else {
    return (
      <EligibleLineItemsScreen
        cart={shopify.cart}
        productSearch={shopify.productSearch}
        i18n={i18n}
      />
    );
  }
};

export default async () => {
  render(
    <I18nProvider locale={shopify.locale}>
      <TileModal />
    </I18nProvider>,
    document.body,
  );
};
