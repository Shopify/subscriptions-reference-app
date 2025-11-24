import {render} from 'preact';
import {SubscriptionScreen} from './screens/SubscriptionScreen';
import I18nProvider from './components/I18nProvider';
import i18n from './i18n/config';

const Modal = () => {
  return (
    <SubscriptionScreen
      lineItem={shopify.cartLineItem}
      cartApi={shopify.cart}
      productSearch={shopify.productSearch}
      session={shopify.session}
      i18n={i18n}
    />
  );
};

export default async () => {
  render(
    <I18nProvider locale={shopify.locale}>
      <Modal />
    </I18nProvider>,
    document.body,
  );
};
