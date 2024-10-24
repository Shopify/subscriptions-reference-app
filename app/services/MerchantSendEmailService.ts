import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

import type {EmailDunningStatusType} from '~/utils/finalActionSettings';

interface MerchantEmailTemplateInput {
  subscriptionContractId: string;
  subscriptionTemplateName: MerchantEmailTemplateNameType;
  dunningStatus?: EmailDunningStatusType;
}

export const MerchantEmailTemplateName = {
  SubscriptionCancelledMerchant: 'SUBSCRIPTION_CANCELED__MERCHANT_',
  SubscriptionPaymentFailureMerchant: 'SUBSCRIPTION_PAYMENT_FAILURE__MERCHANT_',
} as const;

type MerchantEmailTemplateNameType =
  (typeof MerchantEmailTemplateName)[keyof typeof MerchantEmailTemplateName];

export class MerchantSendEmailService {
  async run(
    shopDomain: string,
    templateInput: MerchantEmailTemplateInput,
  ): Promise<boolean> {
    const log = logger.child({shopDomain, templateInput});
    log.info('Running MerchantSendEmailService');

    await unauthenticated.admin(shopDomain);
    return true;
  }
}
