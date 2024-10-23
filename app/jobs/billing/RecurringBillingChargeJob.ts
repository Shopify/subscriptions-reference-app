import type {Jobs} from '~/types';

import {DateTime} from 'luxon';
import {jobs} from '~/jobs';
import {ScheduleShopsToChargeBillingCyclesJob} from '~/jobs/billing/ScheduleShopsToChargeBillingCyclesJob';
import {Job} from '~/lib/jobs';

export class RecurringBillingChargeJob extends Job<{}> {
  async perform(): Promise<void> {
    const targetDate = DateTime.utc().startOf('hour').toISO() as string;

    const params: Jobs.ScheduleShopsForBillingChargeParameters = {targetDate};

    this.logger.info(
      {params},
      `Scheduling ScheduleShopsToChargeBillingCyclesJob to run at ${targetDate}`,
    );

    const job = new ScheduleShopsToChargeBillingCyclesJob(params);
    await jobs.enqueue(job);
  }
}
