import {
  BlockStack,
  Grid,
  GridItem,
  Button,
  Card,
  SkeletonTextBlock,
  View,
  Style,
  Page,
} from '@shopify/ui-extensions-react/customer-account';
import {getBillingCycleInfo} from 'utilities';

import {
  isCreditCardExpired,
  paymentInstrumentIsCreditCard,
} from '../utilities/paymentInstruments/helpers';

import {useSubscriptionContract} from './hooks/useSubscriptionContract';
import {
  UpcomingOrderCard,
  OverviewCard,
  PastOrdersCard,
  PriceSummaryCard,
  PaymentMethodInvalidBanner,
  NotFound,
} from './components';
import {useExtensionApi} from 'foundation/Api';
import {useToast, SuccessToastType} from 'utilities/hooks/useToast';

interface SubscriptionDetailsProps {
  id: string;
}

export function SubscriptionDetails({id}: SubscriptionDetailsProps) {
  const {data, loading, error, refetchSubscriptionContract, refetchLoading} =
    useSubscriptionContract({id});
  const {i18n} = useExtensionApi();
  const {showSuccessToast} = useToast();

  if (!data?.subscriptionContract && loading) {
    return <SubscriptionDetailsSkeleton />;
  }

  if (error) {
    throw error;
  }

  if (data?.subscriptionContract === null || !data) {
    return <NotFound />;
  }

  const {
    id: contractId,
    deliveryPolicy,
    lines,
    orders,
    paymentInstrument,
    shippingAddress,
    shippingMethodTitle,
    pickupAddress,
    priceBreakdownEstimate,
    status,
    billingAddress,
    upcomingBillingCycles,
    lastOrderPrice,
  } = data.subscriptionContract;

  const {nextBillingDate} = getBillingCycleInfo(upcomingBillingCycles);

  function onSkipOrder() {
    showSuccessToast(SuccessToastType.Skipped);
    refetchSubscriptionContract();
  }

  const pageTitle =
    status === 'CANCELLED'
      ? i18n.translate('subscriptionDetails')
      : i18n.translate('manageSubscription');

  const showPaymentMethodInvalidBanner =
    paymentInstrument &&
    paymentInstrumentIsCreditCard(paymentInstrument) &&
    isCreditCardExpired(paymentInstrument);

  return (
    <Page
      title={pageTitle}
      secondaryAction={
        <Button
          to="extension:/"
          accessibilityLabel="Go back to subscription list"
        />
      }
    >
      <Grid
        columns={Style.default(['fill'])
          .when({viewportInlineSize: {min: 'medium'}}, ['fill', 'fill'])
          .when({viewportInlineSize: {min: 'large'}}, [
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
          ])}
        rows="auto"
        spacing={['extraLoose', 'loose']}
      >
        <GridItem
          columnSpan={Style.default(1).when(
            {viewportInlineSize: {min: 'large'}},
            7,
          )}
        >
          <BlockStack spacing="extraLoose">
            {showPaymentMethodInvalidBanner ? (
              <PaymentMethodInvalidBanner creditCard={paymentInstrument} />
            ) : null}
            {status === 'ACTIVE' ? (
              <UpcomingOrderCard
                onSkipOrder={onSkipOrder}
                refetchSubscriptionContract={refetchSubscriptionContract}
                refetchLoading={refetchLoading}
                contractId={contractId}
                upcomingBillingCycles={upcomingBillingCycles}
              />
            ) : null}
            <OverviewCard
              contractId={contractId}
              lines={lines}
              deliveryPolicy={deliveryPolicy}
              paymentInstrument={paymentInstrument}
              shippingAddress={shippingAddress}
              shippingMethodTitle={shippingMethodTitle}
              pickupAddress={pickupAddress}
              status={status}
              billingAddress={billingAddress}
              nextBillingDate={nextBillingDate}
              lastOrderPrice={lastOrderPrice}
              nextOrderPrice={priceBreakdownEstimate?.totalPrice}
              refetchSubscriptionContract={refetchSubscriptionContract}
            />
          </BlockStack>
        </GridItem>
        <GridItem
          columnSpan={Style.default(1).when(
            {viewportInlineSize: {min: 'large'}},
            5,
          )}
        >
          <BlockStack spacing="extraLoose">
            {priceBreakdownEstimate ? (
              <PriceSummaryCard price={priceBreakdownEstimate} />
            ) : null}
            <PastOrdersCard orders={orders} />
          </BlockStack>
        </GridItem>
      </Grid>
    </Page>
  );
}

function SubscriptionDetailsSkeleton() {
  return (
    <Page title="" loading secondaryAction={<Button to="loading" />}>
      <Grid
        columns={Style.default(['fill'])
          .when({viewportInlineSize: {min: 'medium'}}, ['fill', 'fill'])
          .when({viewportInlineSize: {min: 'large'}}, [
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
            'fill',
          ])}
        spacing={['extraLoose', 'loose']}
      >
        <GridItem
          columnSpan={Style.default(1).when(
            {viewportInlineSize: {min: 'large'}},
            7,
          )}
        >
          <BlockStack spacing="extraLoose">
            <Card padding>
              <View>
                <SkeletonTextBlock />
              </View>
            </Card>
            <Card padding>
              <View>
                <SkeletonTextBlock />
                <SkeletonTextBlock />
                <SkeletonTextBlock />
              </View>
            </Card>
          </BlockStack>
        </GridItem>
        <GridItem
          columnSpan={Style.default(1).when(
            {viewportInlineSize: {min: 'large'}},
            5,
          )}
        >
          <BlockStack spacing="extraLoose">
            <Card padding>
              <View>
                <SkeletonTextBlock />
                <SkeletonTextBlock />
              </View>
            </Card>
            <Card padding>
              <View>
                <SkeletonTextBlock />
                <SkeletonTextBlock />
              </View>
            </Card>
          </BlockStack>
        </GridItem>
      </Grid>
    </Page>
  );
}
