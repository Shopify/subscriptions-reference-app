import {config} from 'config';
import {logger} from '~/utils/logger.server';
import {
  CloudTaskScheduler,
  InlineScheduler,
  JobRunner,
  TestScheduler,
} from '~/lib/jobs';
import {
  RecurringWebhookRecoveryJob,
  WebhookSubscriptionRecoveryJob,
  CreateSellingPlanTranslationsJob,
} from './webhooks';
import {
  ChargeBillingCyclesJob,
  RebillSubscriptionJob,
  RecurringBillingChargeJob,
  ScheduleShopsToChargeBillingCyclesJob,
  } from './billing';

import {DisableShopJob, DeleteBillingScheduleJob} from './shop';

import {
  AddFieldsToMetaobjectJob,
  EnqueueAddFieldsToMetaobjectJob,
} from './migrations';

import {DunningStartJob, DunningStopJob} from './dunning';
import {CustomerSendEmailJob, MerchantSendEmailJob} from './email';
import {TagSubscriptionOrderJob} from './tags';

export {
  ChargeBillingCyclesJob,
  RebillSubscriptionJob,
  RecurringBillingChargeJob,
  ScheduleShopsToChargeBillingCyclesJob,
  } from './billing';
export {DisableShopJob, DeleteBillingScheduleJob} from './shop';

export {
  AddFieldsToMetaobjectJob,
  EnqueueAddFieldsToMetaobjectJob,
} from './migrations';

export {DunningStartJob, DunningStopJob} from './dunning';

export {CustomerSendEmailJob, MerchantSendEmailJob} from './email';
export {TagSubscriptionOrderJob} from './tags';
export {
  RecurringWebhookRecoveryJob,
  WebhookSubscriptionRecoveryJob,
  CreateSellingPlanTranslationsJob,
} from './webhooks';

export const jobs = (() => {
  switch (config.jobs.scheduler) {
    case 'INLINE':
      return new JobRunner<InlineScheduler>(
        new InlineScheduler(logger),
        logger,
      );
    case 'TEST':
      return new JobRunner<TestScheduler, Request>(
        new TestScheduler(logger),
        logger,
      );
    case 'CLOUD_TASKS':
      return new JobRunner<CloudTaskScheduler>(
        new CloudTaskScheduler(logger, config.jobs.config),
        logger,
      );
  }
})().register(
  DisableShopJob,
  EnqueueAddFieldsToMetaobjectJob,
  AddFieldsToMetaobjectJob,
  ChargeBillingCyclesJob,
  RecurringBillingChargeJob,
  ScheduleShopsToChargeBillingCyclesJob,
  RebillSubscriptionJob,
  DeleteBillingScheduleJob,
  DunningStartJob,
  DunningStopJob,
  CustomerSendEmailJob,
  MerchantSendEmailJob,
  TagSubscriptionOrderJob,
  RecurringWebhookRecoveryJob,
  WebhookSubscriptionRecoveryJob,
  CreateSellingPlanTranslationsJob,
  );
