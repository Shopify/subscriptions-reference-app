import '@shopify/ui-extensions/preact';
import {
  CartApiContent,
  LineItem,
  ProductSearchApiContent,
  SessionApiContent,
} from '@shopify/ui-extensions/point-of-sale';

import {isError, isLoading, isSuccess} from '../utils/asyncState';
import {PlanItem} from '../components/PlanItem';
import {VariantInfo} from '../components/VariantInfo';
import {formatPricingPolicy} from '../utils/currencyFormatter';
import {
  getProductNameFromVariant,
  getVariantImage,
  getVariantName,
} from '../utils/cart';
import {SellingPlan} from '../types';
import useSubscriptionScreen from '../hooks/useSubscriptionScreen';
import {PreactI18n} from '../i18n/config';

interface Props {
  lineItem: LineItem;
  cartApi: CartApiContent;
  productSearch: ProductSearchApiContent;
  session: SessionApiContent;
  i18n: PreactI18n;
}

export const SubscriptionScreen = ({
  lineItem,
  cartApi,
  productSearch,
  session,
  i18n,
}: Props) => {
  const {
    sellingPlansState,
    variantState,
    selectedPlan,
    setSelectedPlan,
    handleApplyPress,
    oneTimePurchasePrice,
    fetchSellingPlans,
  } = useSubscriptionScreen(lineItem, cartApi, productSearch, session);

  const renderPlans = (plans: SellingPlan[], groupIndex: number) => {
    if (plans.length === 0) {
      return (
        <s-box paddingBlock="large-100">
          <s-text>
            {i18n.t('SubscriptionScreen.noSubscriptionsAvailable')}
          </s-text>
        </s-box>
      );
    }

    return plans.map((plan, planIndex) => {
      const [type, value] =
        formatPricingPolicy(plan.pricingPolicy ?? null) ?? [];
      const subtitle =
        type && value
          ? i18n.t(`SubscriptionScreen.pricingPolicy.${type}`, {
              [type]: value,
            })
          : undefined;

      const isFirstPlan = groupIndex === 0 && planIndex === 0;

      return (
        <PlanItem
          key={planIndex}
          title={plan.name}
          subtitle={subtitle}
          isSelected={
            selectedPlan?.id === plan.id ||
            (Boolean(lineItem.requiresSellingPlan) &&
              !selectedPlan &&
              isFirstPlan)
          }
          onSelect={() => setSelectedPlan(plan)}
        />
      );
    });
  };

  const loading = isLoading(sellingPlansState) || isLoading(variantState);
  const hasSellingPlans =
    isSuccess(sellingPlansState) && sellingPlansState.data.length > 0;
  // Show empty view when successfully loaded but no selling plans available
  const showEmptyView =
    !loading && isSuccess(sellingPlansState) && !hasSellingPlans;

  const renderEmptyView = () => {
    return (
      <s-stack
        alignItems="center"
        blockSize="100%"
        justifyContent="center"
        gap="small"
      >
        <s-icon size="large-100" type="alert-circle" />
        <s-text type="strong">
          {i18n.t('SubscriptionScreen.emptyView.title')}
        </s-text>
        <s-text>{i18n.t('SubscriptionScreen.emptyView.body')}</s-text>
        <s-box inlineSize="348px">
          <s-button variant="primary" onClick={window.close}>
            {i18n.t('SubscriptionScreen.emptyView.goBack')}
          </s-button>
        </s-box>
      </s-stack>
    );
  };

  const renderContent = () => {
    if (isError(sellingPlansState)) {
      let errorMessage = i18n.t('SubscriptionScreen.errorView.body');
      /** Development-time check: concatenates the actual error message for debugging.
       * Please remove this concatenation in production.
       */
      errorMessage += ` (${sellingPlansState.error})`;
      return (
        <s-stack
          alignItems="center"
          blockSize="100%"
          justifyContent="center"
          gap="small"
        >
          <s-icon size="large-100" type="alert-circle" />
          <s-text type="strong">
            {i18n.t('SubscriptionScreen.errorView.title')}
          </s-text>
          <s-text>{errorMessage}</s-text>
          <s-box inlineSize="348px">
            <s-button onClick={fetchSellingPlans}>
              {i18n.t('SubscriptionScreen.errorView.retry')}
            </s-button>
          </s-box>
        </s-stack>
      );
    }

    // Don't render content during loading or when no selling plans available
    if (loading || !hasSellingPlans) {
      return null;
    }

    return (
      <s-scroll-box>
        <s-stack
          direction="block"
          alignContent="stretch"
          paddingInline="large-100"
          inlineSize="100%"
        >
          {isSuccess(variantState) && (
            <VariantInfo
              productName={getProductNameFromVariant(
                variantState.data,
                lineItem,
              )}
              variantName={getVariantName(variantState.data)}
              image={getVariantImage(variantState.data)}
            />
          )}
          {!lineItem.requiresSellingPlan ? (
            <PlanItem
              title={i18n.t('SubscriptionScreen.oneTimePurchase')}
              subtitle={oneTimePurchasePrice}
              isSelected={selectedPlan === undefined}
              onSelect={() => setSelectedPlan(undefined)}
            />
          ) : null}
          {sellingPlansState.data.map((group, groupIndex) => (
            <s-section key={`group-${groupIndex}`} heading={`${group.name}`}>
              {renderPlans(group.plans, groupIndex)}
            </s-section>
          ))}
        </s-stack>
      </s-scroll-box>
    );
  };

  return (
    <s-page>
      <s-button
        slot="secondary-actions"
        onClick={handleApplyPress}
        disabled={!isSuccess(sellingPlansState)}
      >
        {i18n.t('SubscriptionScreen.save')}
      </s-button>
      {showEmptyView ? renderEmptyView() : renderContent()}
    </s-page>
  );
};
