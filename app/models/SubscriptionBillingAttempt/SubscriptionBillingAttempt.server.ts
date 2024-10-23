import {DateTime} from 'luxon';
import type {
  SubscriptionBillingCycleByIndexQuery as SubscriptionBillingCycleByIndexQueryType,
  SubscriptionBillingCyclesQuery as SubscriptionBillingCyclesQueryType,
  SubscriptionPastBillingCyclesQuery as SubscriptionPastBillingCyclesQueryType,
} from 'types/admin.generated';
import type {
  GraphQLClient,
  PastBillingCycle,
  UpcomingBillingCycle,
} from '~/types';
import {logger} from '~/utils/logger.server';

import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {SellingPlanInterval} from 'types/admin.types';
import SubscriptionBillingAttemptQuery from '~/graphql/SubscriptionBillingAttemptQuery';
import SubscriptionBillingCycleByIndexQuery from '~/graphql/SubscriptionBillingCycleByIndexQuery';
import SubscriptionBillingCyclesQuery from '~/graphql/SubscriptionBillingCyclesQuery';
import SubscriptionPastBillingCyclesQuery from '~/graphql/SubscriptionPastBillingCyclesQuery';
import {unauthenticated} from '~/shopify.server';
import {advanceDateTime} from '~/utils/helpers/date';

export async function findSubscriptionBillingAttempt(shop: string, id: string) {
  const {admin} = await unauthenticated.admin(shop);

  const response = await admin.graphql(SubscriptionBillingAttemptQuery, {
    variables: {billingAttemptId: id},
  });

  const json = await response.json();
  const subscriptionBillingAttempt = json.data?.subscriptionBillingAttempt;

  if (!subscriptionBillingAttempt) {
    throw new Error(`Failed to find SubscriptionBillingAttempt with id: ${id}`);
  }

  return subscriptionBillingAttempt;
}

export async function getPastBillingCycles(
  graphql: GraphQLClient,
  contractId: string,
  endDate: string,
): Promise<PastBillingCycle[]> {
  const billingCycles = await (async () => {
    try {
      const {
        data: {subscriptionBillingCycle: firstBillingCycle},
      } = (await (
        await graphql(SubscriptionBillingCycleByIndexQuery, {
          variables: {
            contractId,
            billingCycleIndex: 1,
          },
        })
      ).json()) as {data: SubscriptionBillingCycleByIndexQueryType};

      // we need to use the first billing date since using the contract
      // creation date might throw an error because there's a slight
      // delay between when the contract was created and when the first
      // billing cycle starts and we cannot pass in a start time
      // before the first billing cycle starts
      const firstBillingDate = firstBillingCycle?.cycleStartAt;

      if (!firstBillingDate) {
        return null;
      }

      const response = await graphql(SubscriptionPastBillingCyclesQuery, {
        variables: {
          contractId,
          numberOfCycles: 5,
          numberOfAttempts: 10,
          startDate: firstBillingDate,
          endDate,
        },
      });

      const {data} = (await response.json()) as {
        data: SubscriptionPastBillingCyclesQueryType;
      };

      return nodesFromEdges(data.subscriptionBillingCycles.edges);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(
        {contractId},
        `Unable to fetch past billing cycles: ${error.message}`,
      );
      return null;
    }
  })();

  if (!billingCycles) {
    return [];
  }

  return billingCycles.flatMap((billingCycle) => {
    const {
      billingAttempts,
      skipped,
      billingAttemptExpectedDate,
      cycleIndex,
      status,
    } = billingCycle;
    const attempts = nodesFromEdges(billingAttempts.edges);
    const order = attempts.find((attempt) => Boolean(attempt.order))?.order;

    const isUpcomingBillingCycle =
      (status === 'UNBILLED' && !skipped) ||
      new Date(billingAttemptExpectedDate) > new Date(endDate);

    if (isUpcomingBillingCycle) {
      return [];
    }

    return [
      {
        cycleIndex,
        skipped,
        billingAttemptExpectedDate,
        order: order ?? undefined,
      },
    ];
  });
}

export async function getNextBillingCycleDates(
  graphql: GraphQLClient,
  contractId: string,
  billingCyclesCount: number,
  interval: SellingPlanInterval,
  intervalCount: number,
): Promise<{
  upcomingBillingCycles: UpcomingBillingCycle[];
  hasMoreBillingCycles: boolean;
}> {
  const startDate = new Date().toISOString();

  const advancedDate = advanceDateTime(
    DateTime.now(),
    interval,
    intervalCount,
    billingCyclesCount,
  );

  // Luxon doesn't guarantee `toISO()` will return a string if DateTime is invalid
  // so we default to one year from now
  // `!` at the end because we know DateTime.now() is valid so `toISO()` is too
  const endDate =
    advancedDate.toISO() ?? DateTime.now().plus({year: 1}).toISO()!;

  const response = await graphql(SubscriptionBillingCyclesQuery, {
    variables: {
      contractId,
      first: billingCyclesCount,
      startDate,
      endDate,
    },
  });
  const {data} = (await response.json()) as {
    data: SubscriptionBillingCyclesQueryType;
  };

  if (data === null) {
    throw new Error(
      `Failed to find SubscriptionBillingCycles with contractId: ${contractId}, first: ${billingCyclesCount}, startDate: ${startDate}, endDate: ${endDate}`,
    );
  }

  const upcomingBillingCycles = nodesFromEdges(
    data.subscriptionBillingCycles.edges,
  );

  return {
    upcomingBillingCycles,
    hasMoreBillingCycles: data.subscriptionBillingCycles.pageInfo.hasNextPage,
  };
}
