import {BillingCycle} from 'types';

export function getBillingCycleInfo(upcomingBillingCycles: BillingCycle[]) {
  const unskippedBillingCycles = upcomingBillingCycles.filter(
    (billingCycle) => !billingCycle.skipped,
  );

  const firstUpcomingBillingCycle = unskippedBillingCycles[0] as
    | BillingCycle
    | undefined;
  const secondUpcomingBillingCycle = unskippedBillingCycles[1] as
    | BillingCycle
    | undefined;

  const nextBillingDate = firstUpcomingBillingCycle?.billingAttemptExpectedDate;

  return {
    nextBillingDate,
    canSkipNextBillingCycle: Boolean(secondUpcomingBillingCycle),
    cycleIndexToSkip: firstUpcomingBillingCycle?.cycleIndex,
    resumeDateIfNextCycleSkipped:
      secondUpcomingBillingCycle?.billingAttemptExpectedDate,
  };
}
