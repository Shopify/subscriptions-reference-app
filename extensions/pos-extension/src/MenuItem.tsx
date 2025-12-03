import {render} from 'preact';
import I18nProvider from './components/I18nProvider';
import {MINIMUM_VERSION_SUPPORTED} from './constants/constants';
import {isVersionSupported} from './utils/versionComparison';

const ButtonComponent = () => {
  const handleButtonPress = () => {
    shopify.action.presentModal();
  };

  // Remove this once v10.13.0 is no longer supported
  const versionSupported = isVersionSupported(
    shopify.session.currentSession.posVersion,
    MINIMUM_VERSION_SUPPORTED,
  );

  const hasSellingPlanGroups = shopify.cartLineItem?.hasSellingPlanGroups;
  const enabled = hasSellingPlanGroups && versionSupported;

  const disabledReason = !versionSupported
    ? 'version-unsupported'
    : !hasSellingPlanGroups
      ? 'feature-disabled'
      : null;

  return (
    <s-button
      onClick={handleButtonPress}
      disabled={!enabled}
      variant="secondary"
      data-testid="subscription-menu-item"
      data-disabled-reason={disabledReason}
    />
  );
};

export default async () => {
  render(
    <I18nProvider locale={shopify.locale}>
      <ButtonComponent />
    </I18nProvider>,
    document.body,
  );
};
