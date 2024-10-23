import type pino from 'pino';
import type {
  SubscriptionContractWithBillingCycle,
  SubscriptionContractWithBillingCycleBillingAttempt,
} from '~/models/SubscriptionContract/SubscriptionContract.server';
import type {Settings} from '~/types';

import {
  findOrCreateBy,
  markCompleted,
} from '~/models/DunningTracker/DunningTracker.server';
import {logger} from '~/utils/logger.server';
import {FinalAttemptDunningService} from './FinalAttemptDunningService';
import {PenultimateAttemptDunningService} from './PenultimateAttemptDunningService';
import {RetryDunningService} from './RetryDunningService';

interface DunningServiceArgs {
  shopDomain: string;
  contract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingCycle: SubscriptionContractWithBillingCycle['subscriptionBillingCycle'];
  settings: Settings;
  failureReason: string;
}

type DunningServiceResult =
  | 'BILLING_ATTEMPT_NOT_READY'
  | 'BILLING_CYCLE_ALREADY_BILLED'
  | 'CONTRACT_IN_TERMINAL_STATUS'
  | 'FINAL_ATTEMPT_DUNNING'
  | 'PENULTIMATE_ATTEMPT_DUNNING'
  | 'RETRY_DUNNING';

export class DunningService {
  static BILLING_CYCLE_BILLED_STATUS = 'BILLED';
  static TERMINAL_STATUS = ['EXPIRED', 'CANCELLED'];

  shopDomain: string;
  contract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingCycle: SubscriptionContractWithBillingCycle['subscriptionBillingCycle'];
  settings: Settings;
  failureReason: string;
  log: pino.Logger;

  constructor({
    shopDomain,
    contract,
    billingCycle,
    settings,
    failureReason,
  }: DunningServiceArgs) {
    this.shopDomain = shopDomain;
    this.contract = contract;
    this.billingCycle = billingCycle;
    this.settings = settings;
    this.failureReason = failureReason;
    this.log = logger.child({
      shopDomain: this.shopDomain,
      billingCycle: this.billingCycle,
    });
  }

  async run(): Promise<DunningServiceResult> {
    const {shopDomain, contract, billingCycle, failureReason} = this;

    if (this.billingAttemptNotReady) {
      return 'BILLING_ATTEMPT_NOT_READY';
    }

    const dunningTracker = await findOrCreateBy({
      shop: shopDomain,
      contractId: contract.id,
      billingCycleIndex: billingCycle.cycleIndex,
      failureReason: failureReason,
    });

    if (this.billingCycleAlreadyBilled) {
      await markCompleted(dunningTracker);
      return 'BILLING_CYCLE_ALREADY_BILLED';
    }

    if (this.contractInTerminalStatus) {
      await markCompleted(dunningTracker);
      return 'CONTRACT_IN_TERMINAL_STATUS';
    }

    switch (true) {
      case this.finalAttempt:
        await markCompleted(dunningTracker);
        await new FinalAttemptDunningService({
          shop: this.shopDomain,
          subscriptionContract: this.contract,
          billingCycleIndex: billingCycle.cycleIndex,
          onFailure: this.settings.onFailure,
          sendCustomerEmail: true,
        }).run();
        return 'FINAL_ATTEMPT_DUNNING';
      case this.penultimateAttempt:
        await new PenultimateAttemptDunningService({
          shopDomain,
          subscriptionContract: contract,
          billingAttempt: this.lastBillingAttempt,
          daysBetweenRetryAttempts: this.settings.daysBetweenRetryAttempts,
          dunningStatus: this.settings.onFailure,
          billingCycleIndex: billingCycle.cycleIndex,
        }).run();
        return 'PENULTIMATE_ATTEMPT_DUNNING';
      default:
        await new RetryDunningService({
          shopDomain,
          subscriptionContract: contract,
          billingAttempt: this.lastBillingAttempt,
          daysBetweenRetryAttempts: this.settings.daysBetweenRetryAttempts,
          billingCycleIndex: billingCycle.cycleIndex,
          sendCustomerEmail: true,
        }).run();
        return 'RETRY_DUNNING';
    }
  }

  private get billingAttemptNotReady(): boolean {
    return this.billingCycle.billingAttempts.edges
      .map(({node}) => node)
      .some((attempt) => attempt.ready === false);
  }

  private get billingCycleAlreadyBilled(): boolean {
    return (
      this.billingCycle.status === DunningService.BILLING_CYCLE_BILLED_STATUS
    );
  }

  private get contractInTerminalStatus(): boolean {
    return DunningService.TERMINAL_STATUS.includes(this.contract.status);
  }

  private get finalAttempt(): boolean {
    return this.billingAttemptsCount >= this.settings.retryAttempts;
  }

  private get penultimateAttempt(): boolean {
    return this.billingAttemptsCount === this.settings.retryAttempts - 1;
  }

  private get billingAttemptsCount(): number {
    return this.billingCycle.billingAttempts.edges.length;
  }

  private get lastBillingAttempt(): SubscriptionContractWithBillingCycleBillingAttempt {
    const lastBillingAttempt =
      this.billingCycle.billingAttempts.edges[this.billingAttemptsCount - 1]
        .node;
    this.log.info('lastBillingAttempt ', lastBillingAttempt);
    return lastBillingAttempt;
  }
}
