import {Job} from '~/lib/jobs';
import {jobs} from '~/jobs';
import {AddFieldsToMetaobjectJob} from '~/jobs/migrations/AddFieldsToMetaobjectJob';
import {findActiveBillingSchedulesInBatches} from '~/models/BillingSchedule/BillingSchedule.server';
import {logger} from '~/utils/logger.server';

export class EnqueueAddFieldsToMetaobjectJob extends Job<{}> {
  public queue: string = 'migrations';

  async perform(): Promise<void> {
    await findActiveBillingSchedulesInBatches(async (batch) => {
      logger.info(
        `Scheduling AddFieldsToMetaobjectJob for ${batch.length} shops`,
      );

      const enqueuePromises = batch.map((billingSchedule) =>
        jobs.enqueue(
          new AddFieldsToMetaobjectJob({
            shop: billingSchedule.shop,
            payload: {},
          }),
        ),
      );

      await Promise.all(enqueuePromises);
    });
  }
}
