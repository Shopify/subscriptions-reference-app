import {DateTime} from 'luxon';
import type pino from 'pino';
import type {
  SubscriptionContractWithBillingCycle,
  SubscriptionContractWithBillingCycleBillingAttempt,
} from '~/models/SubscriptionContract/SubscriptionContract.server';

import {jobs} from '~/jobs';
import {RebillSubscriptionJob} from '~/jobs/billing/RebillSubscriptionJob';
import {getContractCustomerId} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {logger} from '~/utils/logger.server';
import {
  CustomerEmailTemplateName,
  CustomerSendEmailService,
} from './CustomerSendEmailService';
import {SubscriptionContractFailService} from './SubscriptionContractFailService';

interface RetryDunningServiceParams {
  shopDomain: string;
  subscriptionContract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingAttempt: SubscriptionContractWithBillingCycleBillingAttempt;
  billingCycleIndex: number;
  daysBetweenRetryAttempts: number;
  sendCustomerEmail: boolean;
}

export class RetryDunningService {
  private log: pino.Logger;

  constructor(private params: RetryDunningServiceParams) {
    this.log = logger.child({shopDomain: params.shopDomain, params: params});
  }

  async run() {
    this.log.info('Running RetryDunningService');

    await this.scheduleRebillSubscriptionJob();

    if (this.params.sendCustomerEmail) {
      await this.sendPaymentFailureEmail();
    }

    await this.failSubscriptionContract();

    this.log.info('RetryDunningService completed successfully');
  }

  private async scheduleRebillSubscriptionJob() {
    this.log.info('Scheduling RebillSubscriptionJob');
    const jobScheduleEpochTimestamp = this.scheduledTime;

    const job = new RebillSubscriptionJob({
      shop: this.shopDomain,
      payload: {
        subscriptionContractId: this.subscriptionContract.id,
        originTime: this.billingAttempt.originTime,
      },
    });

    await jobs.enqueue(job, {
      scheduleTime: {
        seconds: jobScheduleEpochTimestamp,
      },
    });

    this.log.info(
      {jobScheduleEpochTimestamp},
      'Scheduled RebillSubscriptionJob for',
    );
  }

  private async sendPaymentFailureEmail() {
    const customerId = await getContractCustomerId(
      this.shopDomain,
      this.subscriptionContract.id,
    );
    await new CustomerSendEmailService().run(
      this.shopDomain,
      customerId,
      this.templateInput,
    );
  }

  private async failSubscriptionContract() {
    await new SubscriptionContractFailService(
      this.shopDomain,
      this.subscriptionContract.id,
    ).run();
  }

  private get scheduledTime() {
    return DateTime.now()
      .plus({days: this.params.daysBetweenRetryAttempts})
      .toSeconds();
  }

  private get templateInput() {
    return {
      subscriptionContractId: this.subscriptionContract.id,
      subscriptionTemplateName:
        CustomerEmailTemplateName.SubscriptionPaymentFailureRetry,
      billingCycleIndex: this.billingCycleIndex,
    };
  }

  private get shopDomain(): string {
    return this.params.shopDomain;
  }

  private get subscriptionContract(): SubscriptionContractWithBillingCycle['subscriptionContract'] {
    return this.params.subscriptionContract;
  }

  private get billingAttempt(): SubscriptionContractWithBillingCycleBillingAttempt {
    return this.params.billingAttempt;
  }

  private get billingCycleIndex(): number {
    return this.params.billingCycleIndex;
  }
}
