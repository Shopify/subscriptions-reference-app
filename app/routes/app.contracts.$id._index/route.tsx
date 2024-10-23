import {type ShouldRevalidateFunction, useLoaderData} from '@remix-run/react';
import {composeGid, parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  Banner,
  BlockStack,
  Box,
  Grid,
  type MenuActionDescriptor,
  Page,
  Text,
} from '@shopify/polaris';
import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {SubscriptionContractStatus, type UpcomingBillingCycle} from '~/types';
import {StatusBadge} from '~/components';
import {
  getNextBillingCycleDates,
  getPastBillingCycles,
} from '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server';
import {getContractDetails} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {authenticate} from '~/shopify.server';
import {NUM_BILLING_CYCLES_TO_SHOW} from '~/utils/constants';
import {PaymentSummaryCard} from '~/components/PaymentSummaryCard/PaymentSummaryCard';
import {CancelSubscriptionModal} from './components/CancelSubscriptionModal/CancelSubscriptionModal';
import {CustomerDetailsCard} from './components/CustomerDetailsCard/CustomerDetailsCard';
import {CustomerPaymentMethodDetailsCard} from './components/CustomerPaymentMethodDetailsCard/CustomerPaymentMethodDetailsCard';
import {PastOrdersCard} from './components/PastOrdersCard/PastOrdersCard';
import {SubscriptionDetailsCard} from './components/SubscriptionDetailsCard/SubscriptionDetailsCard';
import {UpcomingBillingCyclesCard} from './components/UpcomingBillingCyclesCard/UpcomingBillingCyclesCard';
import {usePauseAction} from './hooks/usePauseAction';
import {useResumeAction} from './hooks/useResumeAction';
import {formatStatus} from '~/utils/helpers/contracts';
import {useFormatDate} from '~/utils/helpers/date';
import {useBillContractAction} from '~/routes/app.contracts.$id._index/hooks/useBillContractAction';
import {CreateOrderModal} from '~/routes/app.contracts.$id._index/components/CreateOrderModal/CreateOrderModal';
import {FailedBillingAttemptBanner} from './components/FailedBillingAttemptBanner/FailedBillingAttemptBanner';

export const handle = {
  i18n: 'app.contracts',
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (
    formAction &&
    (formAction.match(/^\/app\/contracts\/\d+\/poll-bill-attempt$/) ||
      formAction.match(/^\/app\/contracts\/\d+\/bill-contract$/))
  ) {
    return false;
  }
  return defaultShouldRevalidate;
};

export async function loader({params, request}) {
  const {admin} = await authenticate.admin(request);
  const id = params.id;
  const gid = composeGid('SubscriptionContract', id);
  const billingCyclesParam = new URL(request.url).searchParams.get(
    'billingCycles',
  );
  const parsedBillingCycles =
    parseInt(billingCyclesParam || '') || NUM_BILLING_CYCLES_TO_SHOW;
  const billingCyclesCount = Math.min(250, parsedBillingCycles);

  const subscriptionContract = await getContractDetails(admin.graphql, gid);

  const {
    billingPolicy: {interval, intervalCount},
  } = subscriptionContract;

  const upcomingBillingCyclesPromise =
    subscriptionContract.status !== SubscriptionContractStatus.Cancelled
      ? getNextBillingCycleDates(
          admin.graphql,
          gid,
          billingCyclesCount,
          interval,
          intervalCount,
        )
      : {
          upcomingBillingCycles: [],
          hasMoreBillingCycles: false,
        };

  const [upcomingBillingCycleResults, pastBillingCyclesResult] =
    await Promise.all([
      upcomingBillingCyclesPromise,
      getPastBillingCycles(admin.graphql, gid, new Date().toISOString()),
    ]);

  const {upcomingBillingCycles, hasMoreBillingCycles} =
    upcomingBillingCycleResults;
  const {pastBillingCycles, failedBillingCycle} = pastBillingCyclesResult;

  return {
    subscriptionContract,
    upcomingBillingCycles,
    pastBillingCycles,
    hasMoreBillingCycles,
    failedBillingCycle,
  };
}

export default function ContractsDetailsPage() {
  const {t, i18n} = useTranslation('app.contracts');
  const formatDate = useFormatDate();

  const {
    subscriptionContract,
    upcomingBillingCycles,
    pastBillingCycles,
    hasMoreBillingCycles,
    failedBillingCycle,
  } = useLoaderData<typeof loader>();

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openCreateOrderModal, setOpenCreateOrderModal] = useState(false);
  const closeCancelModal = useCallback(() => setOpenCancelModal(false), []);
  const closeCreateOrderModal = useCallback(
    () => setOpenCreateOrderModal(false),
    [],
  );

  if (!subscriptionContract) {
    throw new Error('Subscription contract not found');
  }

  const {pauseContract, pauseLoading} = usePauseAction();
  const {resumeContract, resumeLoading} = useResumeAction();
  const {billContract, billContractLoading, isAttemptInProgress} =
    useBillContractAction();

  const {customerPaymentMethod, customer, deliveryMethod, status} =
    subscriptionContract;

  const pauseAction =
    status === SubscriptionContractStatus.Active
      ? {
          content: t('actions.pause.title'),
          accessibilityLabel: t('actions.pause.accessibilityLabel'),
          onAction: pauseContract,
          loading: pauseLoading,
        }
      : null;

  const resumeAction =
    status === SubscriptionContractStatus.Paused
      ? {
          content: t('actions.resume.title'),
          accessibilityLabel: t('actions.resume.accessibilityLabel'),
          onAction: resumeContract,
          loading: resumeLoading,
        }
      : null;

  const cancelAction =
    status !== SubscriptionContractStatus.Cancelled
      ? {
          content: t('actions.cancel.title'),
          destructive: true,
          accessibilityLabel: t('actions.cancel.accessibilityLabel'),
          onAction: () => setOpenCancelModal(true),
        }
      : null;

  const billContractAction =
    failedBillingCycle && status === SubscriptionContractStatus.Active
      ? {
          content: t('actions.billContract.title'),
          destructive: false,
          disabled: isAttemptInProgress,
          accessibilityLabel: t('actions.billContract.accessibilityLabel'),
          onAction: () => billContract(failedBillingCycle.cycleIndex, false),
          loading: billContractLoading,
        }
      : null;

  const actions = [
    billContractAction,
    pauseAction,
    resumeAction,
    cancelAction,
  ].filter(Boolean) as MenuActionDescriptor[];

  const originOrder = subscriptionContract.originOrder;
  const subtitle = originOrder
    ? `${formatDate(originOrder.createdAt, i18n.language)} • ${t('details.orderNumber', {number: originOrder.name})}`
    : '';

  const shouldShowFailedBillingAttemptBanner =
    failedBillingCycle &&
    !isAttemptInProgress &&
    status === SubscriptionContractStatus.Active;

  return (
    <Page
      backAction={{
        content: t('table.resourceName.plural'),
        url: '/app',
      }}
      title={parseGid(subscriptionContract.id)}
      subtitle={subtitle}
      titleMetadata={
        <StatusBadge status={formatStatus(subscriptionContract.status)} />
      }
      secondaryActions={actions}
    >
      {isAttemptInProgress && (
        <Box paddingBlockEnd="400">
          <Banner>
            <Text as="p">{t('failedOrder.banner.inProgressTitle')}</Text>
          </Banner>
        </Box>
      )}
      {shouldShowFailedBillingAttemptBanner ? (
        <FailedBillingAttemptBanner
          onOpen={() => setOpenCreateOrderModal(true)}
          billingCycleDate={failedBillingCycle.billingAttemptExpectedDate}
        />
      ) : null}
      <Box paddingBlockEnd="400">
        <Grid columns={{xs: 1, sm: 1, md: 3, lg: 3, xl: 3}}>
          <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 2, lg: 2, xl: 2}}>
            <BlockStack gap="400">
              <SubscriptionDetailsCard
                subscriptionContract={subscriptionContract}
                outOfStockVariants={
                  failedBillingCycle?.outOfStockProductVariants ?? []
                }
              />
              {subscriptionContract?.priceBreakdownEstimate && (
                <PaymentSummaryCard
                  subtotal={
                    subscriptionContract.priceBreakdownEstimate.subtotalPrice
                  }
                  totalTax={
                    subscriptionContract.priceBreakdownEstimate.totalTax
                  }
                  totalShipping={
                    subscriptionContract.priceBreakdownEstimate
                      .totalShippingPrice
                  }
                  total={subscriptionContract.priceBreakdownEstimate.totalPrice}
                  deliveryMethod={
                    subscriptionContract.deliveryMethod ?? undefined
                  }
                />
              )}
              {subscriptionContract.status !==
              SubscriptionContractStatus.Cancelled ? (
                <UpcomingBillingCyclesCard
                  upcomingBillingCycles={
                    upcomingBillingCycles as UpcomingBillingCycle[]
                  }
                  contractStatus={subscriptionContract.status}
                  hasMoreBillingCycles={hasMoreBillingCycles}
                  failedBillingCycle={failedBillingCycle}
                />
              ) : null}
            </BlockStack>
          </Grid.Cell>
          <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
            <BlockStack gap="400">
              {customer ? (
                <CustomerDetailsCard
                  customer={customer}
                  deliveryMethod={deliveryMethod ?? undefined}
                />
              ) : null}
              {customerPaymentMethod && customer ? (
                <CustomerPaymentMethodDetailsCard
                  customerPaymentMethod={customerPaymentMethod}
                  customer={customer}
                />
              ) : null}
              {pastBillingCycles.length > 0 ? (
                <PastOrdersCard pastBillingCycles={pastBillingCycles} />
              ) : null}
            </BlockStack>
          </Grid.Cell>
        </Grid>
        <CancelSubscriptionModal
          open={openCancelModal}
          onClose={closeCancelModal}
        />
        <CreateOrderModal
          open={openCreateOrderModal}
          onClose={closeCreateOrderModal}
          onCreateOrder={() =>
            billContract(failedBillingCycle!.cycleIndex, true)
          }
          outOfStockVariants={
            failedBillingCycle?.outOfStockProductVariants ?? []
          }
        />
      </Box>
    </Page>
  );
}
