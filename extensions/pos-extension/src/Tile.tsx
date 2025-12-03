import {render} from 'preact';
import {useSellingPlanTile} from './hooks/useSellingPlanTile';
import I18nProvider from './components/I18nProvider';
import i18n from './i18n/config';

const TileComponent = () => {
  const {title, subtitle, enabled, disabledReason, onCartChange} =
    useSellingPlanTile(
      shopify.cart.current.value,
      i18n,
      shopify.session.currentSession.posVersion,
    );

  shopify.cart.current.subscribe((cart) => {
    onCartChange(cart);
  });

  return (
    <s-tile
      heading={title}
      subheading={subtitle}
      onClick={() => {
        shopify.action.presentModal();
      }}
      disabled={!enabled}
      data-testid="subscription-tile"
      data-disabled-reason={disabledReason}
    />
  );
};

export default async () => {
  render(
    <I18nProvider locale={shopify.locale}>
      <TileComponent />
    </I18nProvider>,
    document.body,
  );
};
