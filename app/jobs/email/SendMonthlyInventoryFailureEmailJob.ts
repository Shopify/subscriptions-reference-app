import type {Jobs} from '~/types';
import {loadSettingsMetaobject} from '~/models/Settings/Settings.server';
import {unauthenticated} from '~/shopify.server';
import {jobs} from '~/jobs';
import {SendInventoryFailureEmailJob} from './SendInventoryFailureEmailJob';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {isFulfilled} from '~/utils/typeGuards/promises';
import {Job} from '~/lib/jobs';

export class SendMonthlyInventoryFailureEmailJob extends Job<{}> {
  async perform(): Promise<void> {
    await findActiveBillingSchedulesInBatches(async (batch) => {
      this.logger.info(
        `Scheduling SendMonthlyInventoryFailureEmailJob for ${batch.length} shops`,
      );

      const results = await Promise.allSettled(
        batch.map(async (billingSchedule) => {
          const {admin} = await unauthenticated.admin(billingSchedule.shop);
          const settings = await loadSettingsMetaobject(admin.graphql);

          if (!settings) {
            this.logger.error(
              {shopDomain: billingSchedule.shop},
              'Failed to load settings from metaobject for shop',
            );
            return false;
          }

          const isMonthlyNotificationFrequency: boolean =
            settings.inventoryNotificationFrequency === 'monthly';

          if (isMonthlyNotificationFrequency) {
            const params: Jobs.Parameters<{}> = {
              shop: billingSchedule.shop,
              payload: {},
            };

            this.logger.info(
              {params},
              'Scheduling SendMonthlyInventoryFailureEmailJob with params',
            );

            const job = new SendInventoryFailureEmailJob(params);

            try {
              await jobs.enqueue(job);
              return true;
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));

              this.logger.error(error);
              return false;
            }
          }

          return false;
        }),
      );

      const startedJobsCount = results.filter(
        (result) => isFulfilled(result) && result.value,
      ).length;

      this.logger.info(
        {successCount: startedJobsCount, batchCount: results.length},
        'Successfully enqueued SendMonthlyInventoryFailureEmailJob jobs',
      );
    });
  }
}
