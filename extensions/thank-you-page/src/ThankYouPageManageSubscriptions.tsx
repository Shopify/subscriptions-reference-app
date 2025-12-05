import '@shopify/ui-extensions/preact';
import {render} from 'preact';

export function ThankYouPageManageSubscriptions() {
  const shop = shopify.shop;
  const isEditor = shopify.extension.editor;
  const defaultAccountURL = `${shop?.storefrontUrl || ''}/account`;
  const hasSubscription =
    shopify.lines?.value?.some(
      (line) => line.merchandise?.sellingPlan?.recurringDeliveries,
    ) ?? false;
  if (!hasSubscription && !isEditor) {
    return null;
  }
  const translate = shopify.i18n.translate;
  return (
    <s-stack direction="block" gap="base">
      {isEditor ? (
        <s-banner tone="info">
          This extension is only visible for orders with subscriptions.
        </s-banner>
      ) : null}
      <s-box padding="base" border="base" borderRadius="base">
        <s-stack direction="block" gap="base">
          <s-heading>{translate('title')}</s-heading>
          <s-text>{translate('content')}</s-text>
          <s-button variant="secondary" href={defaultAccountURL}>
            {translate('manageSubscriptionLink')}
          </s-button>
        </s-stack>
      </s-box>
    </s-stack>
  );
}

export default async () => {
  render(<ThankYouPageManageSubscriptions />, document.body);
};
