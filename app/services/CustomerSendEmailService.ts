import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

import type {EmailDunningStatusType} from '~/utils/finalActionSettings';

export interface CustomerEmailTemplateInput {
  subscriptionContractId: string;
  subscriptionTemplateName: CustomerEmailTemplateNameType;
  billingCycleIndex?: number;
  dunningStatus?: EmailDunningStatusType;
  finalChargeDate?: string;
}

export const CustomerEmailTemplateName = {
  NewSubscription: 'NEW_SUBSCRIPTION',
  SubscriptionCancelled: 'SUBSCRIPTION_CANCELED',
  SubscriptionPaused: 'SUBSCRIPTION_PAUSED',
  SubscriptionResumed: 'SUBSCRIPTION_RESUMED',
  SubscriptionSkipped: 'SUBSCRIPTION_SKIPPED',
  SubscriptionPaymentFailure: 'SUBSCRIPTION_PAYMENT_FAILURE',
  SubscriptionPaymentFailureRetry: 'SUBSCRIPTION_PAYMENT_FAILURE_RETRY',
  SubscriptionPaymentFailureLastAttempt:
    'SUBSCRIPTION_PAYMENT_FAILURE_LAST_ATTEMPT',
} as const;

export type CustomerEmailTemplateNameType =
  (typeof CustomerEmailTemplateName)[keyof typeof CustomerEmailTemplateName];

export class CustomerSendEmailService {
  async run(
    shopDomain: string,
    customerId: string,
    templateInput: CustomerEmailTemplateInput,
  ): Promise<boolean> {
    const log = logger.child({shopDomain, customerId, templateInput});

    log.info('Running CustomerSendEmailService');

    await unauthenticated.admin(shopDomain);
    return true;
  }
}
