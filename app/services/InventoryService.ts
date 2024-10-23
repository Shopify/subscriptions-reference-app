import {logger} from '~/utils/logger.server';
import type pino from 'pino';
import {RetryDunningService} from './RetryDunningService';
import {FinalAttemptDunningService} from './FinalAttemptDunningService';
import {DunningService} from './DunningService';
import {DateTime} from 'luxon';
import {
  findOrCreateBy,
  markCompleted,
} from '~/models/DunningTracker/DunningTracker.server';
import type {SubscriptionContractWithBillingCycle} from '~/models/SubscriptionContract/SubscriptionContract.server';
import type {Settings} from '~/types';

type InventoryServiceResult =
  | 'BILLING_ATTEMPT_NOT_READY'
  | 'BILLING_CYCLE_ALREADY_BILLED'
  | 'CONTRACT_IN_TERMINAL_STATUS'
  | 'INSUFFICIENT_INVENTORY'
  | 'INVENTORY_ALLOCATIONS_NOT_FOUND'
  | 'EXPECTED_DATE_IN_FUTURE';

interface InventoryServiceArgs {
  shopDomain: string;
  contract: SubscriptionContractWithBillingCycle['subscriptionContract'];
  billingCycle: SubscriptionContractWithBillingCycle['subscriptionBillingCycle'];
  settings: Settings;
  failureReason: string;
}

// TODO: this must be removed when the inventory fields on settings object is changed to required
// from optinal
const DEFAULT_INVENTORY_DAYS_BETWEEN_RETRY_ATTEMPTS = 1;
const DEFAULT_INVENTORY_RETRY_ATTEMPTS = 5;

export class InventoryService {
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
  }: InventoryServiceArgs) {
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

  async run(): Promise<InventoryServiceResult> {
    if (this.billingAttemptNotReady) {
      return 'BILLING_ATTEMPT_NOT_READY';
    }

    const dunningTracker = await findOrCreateBy({
      shop: this.shopDomain,
      contractId: this.contract.id,
      billingCycleIndex: this.billingCycle.cycleIndex,
      failureReason: this.failureReason,
    });

    if (
      DateTime.fromISO(this.billingCycle.billingAttemptExpectedDate) >
      DateTime.now()
    ) {
      await markCompleted(dunningTracker);
      return 'EXPECTED_DATE_IN_FUTURE';
    }

    if (this.billingCycleAlreadyBilled) {
      await markCompleted(dunningTracker);
      return 'BILLING_CYCLE_ALREADY_BILLED';
    }

    if (this.contractInTerminalStatus) {
      await markCompleted(dunningTracker);
      return 'CONTRACT_IN_TERMINAL_STATUS';
    }

    const billingAttemptsCount = this.billingCycle.billingAttempts.edges.length;
    const lastBillingAttempt =
      this.billingCycle.billingAttempts.edges[billingAttemptsCount - 1].node;

    // TODO: this must be removed when the inventory fields on settings object is changed to required
    const inventoryRetryAttempt =
      this.settings.inventoryRetryAttempts || DEFAULT_INVENTORY_RETRY_ATTEMPTS;
    const inventoryDaysBetweenRetryAttempts =
      this.settings.inventoryDaysBetweenRetryAttempts ||
      DEFAULT_INVENTORY_DAYS_BETWEEN_RETRY_ATTEMPTS;

    if (
      this.billingCycle.billingAttempts.edges.length >= inventoryRetryAttempt
    ) {
      await markCompleted(dunningTracker);
      await new FinalAttemptDunningService({
        shop: this.shopDomain,
        subscriptionContract: this.contract,
        billingCycleIndex: this.billingCycle.cycleIndex,
        onFailure: this.settings.onFailure,
        sendCustomerEmail: false,
      }).run();
    } else {
      await new RetryDunningService({
        shopDomain: this.shopDomain,
        subscriptionContract: this.contract,
        billingAttempt: lastBillingAttempt,
        daysBetweenRetryAttempts: inventoryDaysBetweenRetryAttempts,
        billingCycleIndex: this.billingCycle.cycleIndex,
        sendCustomerEmail: false,
      }).run();
    }

    return this.failureReason as InventoryServiceResult;
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
}
