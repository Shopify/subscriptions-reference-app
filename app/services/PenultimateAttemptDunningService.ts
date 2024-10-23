import type pino from 'pino';
import type {
  SubscriptionContractWithBillingCycle,
  SubscriptionContractWithBillingCycleBillingAttempt,
} from '~/models/SubscriptionContract/SubscriptionContract.server';

import {DateTime} from 'luxon';
import {jobs} from '~/jobs';
import {RebillSubscriptionJob} from '~/jobs/billing/RebillSubscriptionJob';
import {getContractCustomerId} from '~/models/SubscriptionContract/SubscriptionContract.server';
import type {OnFailureTypeType} from '~/routes/app.settings._index/validator';
import {
  emailDunningStatus,
  type EmailDunningStatusType,
} from '~/utils/finalActionSettings';
import {logger} from '~/utils/logger.server';
import {
  CustomerEmailTemplateName,
  CustomerSendEmailService,
} from './CustomerSendEmailService';
import {SubscriptionContractFailService} from './SubscriptionContractFailService';

interface PenultimateAttemptDunningServiceArgs {
  shopDomain: string;
  subscriptionContract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingAttempt: SubscriptionContractWithBillingCycleBillingAttempt;
  daysBetweenRetryAttempts: number;
  dunningStatus: OnFailureTypeType;
  billingCycleIndex: number;
}

export class PenultimateAttemptDunningService {
  private log: pino.Logger;

  get shopDomain(): string {
    return this.args.shopDomain;
  }
  get subscriptionContract(): SubscriptionContractWithBillingCycle['subscriptionContract'] {
    return this.args.subscriptionContract;
  }
  get billingAttempt(): SubscriptionContractWithBillingCycleBillingAttempt {
    return this.args.billingAttempt;
  }
  get daysBetweenRetryAttempts(): number {
    return this.args.daysBetweenRetryAttempts;
  }
  get dunningStatus(): EmailDunningStatusType {
    return emailDunningStatus(this.args.dunningStatus);
  }
  get billingCycleIndex(): number {
    return this.args.billingCycleIndex;
  }

  constructor(private args: PenultimateAttemptDunningServiceArgs) {
    this.log = logger.child({shopDomain: this.shopDomain, params: args});
  }

  async run() {
    this.log.info('Running PenultimateAttemptDunningService');
    await this.scheduleRebillSubscriptionJob();
    await this.failSubscriptionContract();
    await this.sendLastPaymentFailureEmail();
    this.log.info('PenultimateAttemptDunningService completed successfully');
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

  private async failSubscriptionContract() {
    await new SubscriptionContractFailService(
      this.shopDomain,
      this.subscriptionContract.id,
    ).run();
  }

  private async sendLastPaymentFailureEmail() {
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

  private get scheduledTime() {
    return DateTime.now()
      .plus({days: this.daysBetweenRetryAttempts})
      .toSeconds();
  }

  private get templateInput() {
    return {
      subscriptionContractId: this.subscriptionContract.id,
      subscriptionTemplateName:
        CustomerEmailTemplateName.SubscriptionPaymentFailureLastAttempt,
      dunningStatus: this.dunningStatus,
      billingCycleIndex: this.billingCycleIndex,
      finalChargeDate: this.finalChargeDate,
    };
  }

  private get finalChargeDate() {
    const finalChargeDateTime = DateTime.utc()
      .plus({days: this.daysBetweenRetryAttempts})
      .toISODate();
    if (!finalChargeDateTime) {
      throw new Error('Invalid finalChargeDateTime');
    } else {
      return finalChargeDateTime;
    }
  }
}
