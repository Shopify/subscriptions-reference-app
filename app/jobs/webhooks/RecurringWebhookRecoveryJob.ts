import {jobs} from '~/jobs';
import {WebhookSubscriptionRecoveryJob} from '~/jobs/webhooks/WebhookSubscriptionRecoveryJob';
import {Job} from '~/lib/jobs';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {logger} from '~/utils/logger.server';

export class RecurringWebhookRecoveryJob extends Job<{}> {
  async perform(): Promise<void> {
    await findActiveBillingSchedulesInBatches(async (batch) => {
      logger.info(
        `Scheduling WebhookSubscriptionRecoveryJob for ${batch.length} shops`,
      );

      const enqueuePromises = batch.map((billingSchedule) =>
        jobs.enqueue(
          new WebhookSubscriptionRecoveryJob({
            shop: billingSchedule.shop,
            payload: {},
          }),
        ),
      );

      await Promise.all(enqueuePromises);
    });
  }
}
