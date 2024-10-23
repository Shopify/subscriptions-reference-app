import {
  Grid,
  BlockStack,
  Style,
  SkeletonTextBlock,
  SkeletonImage,
  Card,
  View,
  Page,
} from '@shopify/ui-extensions-react/customer-account';

import {useSubscriptionListData} from './hooks/useSubscriptionListData';
import {SubscriptionListEmptyState, SubscriptionListItem} from './components';
import {useExtensionApi} from 'foundation/Api';

export function SubscriptionList() {
  const {i18n} = useExtensionApi();
  const {data, loading, error, refetchSubscriptionListData} =
    useSubscriptionListData();

  if (loading && !data) {
    return <SubscriptionListLoadingState />;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (data?.subscriptionContracts.length === 0) {
    return <SubscriptionListEmptyState />;
  }

  const listItems = data?.subscriptionContracts.length
    ? data.subscriptionContracts.map(
        ({
          lines,
          id,
          status,
          upcomingBillingCycles,
          deliveryPolicy,
          updatedAt,
          totalQuantity,
          lastOrderPrice,
          priceBreakdownEstimate,
        }) => {
          const {name, image} = lines[0];

          return (
            <SubscriptionListItem
              key={id}
              id={id}
              upcomingBillingCycles={upcomingBillingCycles}
              firstLineName={name}
              lineCount={lines.length}
              totalQuantity={totalQuantity}
              image={image}
              status={status}
              deliveryPolicy={deliveryPolicy}
              updatedAt={updatedAt}
              lastOrderPrice={lastOrderPrice}
              refetchSubscriptionListData={refetchSubscriptionListData}
              totalPrice={priceBreakdownEstimate?.totalPrice}
            />
          );
        },
      )
    : null;

  return (
    <Page title={i18n.translate('subscriptions')}>
      <Grid
        columns={Style.default(['fill'])
          .when({viewportInlineSize: {min: 'small'}}, ['fill', 'fill'])
          .when({viewportInlineSize: {min: 'medium'}}, [
            'fill',
            'fill',
            'fill',
          ])}
        spacing="loose"
        rows="auto"
      >
        {listItems}
      </Grid>
    </Page>
  );
}

export function SubscriptionListLoadingState() {
  const {i18n} = useExtensionApi();

  return (
    <Page title={i18n.translate('subscriptions')} loading>
      <Grid
        columns={Style.default(['fill'])
          .when({viewportInlineSize: {min: 'small'}}, ['fill', 'fill'])
          .when({viewportInlineSize: {min: 'medium'}}, [
            'fill',
            'fill',
            'fill',
          ])}
        spacing="loose"
      >
        <View data-testid="loading-state">
          <Card padding>
            <BlockStack>
              <SkeletonTextBlock lines={2} size="extraLarge" />
              <SkeletonImage inlineSize="fill" blockSize={380} />
              <SkeletonTextBlock lines={3} />
              <SkeletonTextBlock lines={1} emphasis="bold" size="extraLarge" />
            </BlockStack>
          </Card>
        </View>
      </Grid>
    </Page>
  );
}
