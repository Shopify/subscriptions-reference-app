import type {Jobs} from '~/types';

import {DateTime} from 'luxon';

import {jobs} from '~/jobs';
import {Job} from '~/lib/jobs';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {BillingScheduleCalculatorService} from '~/services/BillingScheduleCalculatorService';
import {ChargeBillingCyclesJob} from './ChargeBillingCyclesJob';

export class ScheduleShopsToChargeBillingCyclesJob extends Job<Jobs.ScheduleShopsForBillingChargeParameters> {
  public queue: string = 'billing';

  async perform(): Promise<void> {
    const targetDateUtc = DateTime.fromISO(this.parameters.targetDate, {
      setZone: true,
    });

    await findActiveBillingSchedulesInBatches(async (batch) => {
      this.logger.debug(`Processing batch of ${batch.length} records`);

      const results = batch
        .map(
          (billingSchedule) =>
            new BillingScheduleCalculatorService(
              billingSchedule,
              targetDateUtc,
            ),
        )
        .filter((calc) => calc.isBillable());

      this.logger.info(
        {
          targetDate: targetDateUtc.toISO(),
          billingScheduleCount: results.length,
        },
        `Found ${results.length} shops for billing in batch`,
      );

      const promises = results.map(async (result) => {
        const {
          billingStartTimeUtc,
          billingEndTimeUtc,
          record: billingSchedule,
        } = result;

        const params: Jobs.Parameters<Jobs.ChargeBillingCyclesPayload> = {
          shop: billingSchedule.shop,
          payload: {
            startDate: billingStartTimeUtc.toISO() as string,
            endDate: billingEndTimeUtc.toISO() as string,
          },
        };

        this.logger.info(
          {params},
          'Scheduling ChargeBillingCyclesJob with params',
        );

        const job = new ChargeBillingCyclesJob(params);
        return await jobs.enqueue(job);
      });

      await Promise.all(promises);
    });
  }
}
