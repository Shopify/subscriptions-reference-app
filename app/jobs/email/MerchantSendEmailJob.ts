import type {Jobs, Webhooks} from '~/types';
import {Job} from '~/lib/jobs';
import {
  MerchantEmailTemplateName,
  MerchantSendEmailService,
} from '~/services/MerchantSendEmailService';

export class MerchantSendEmailJob extends Job<
  Jobs.Parameters<Webhooks.SubscriptionContractId>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;
    const {admin_graphql_api_id: subscriptionContractId} = payload;

    const merchantTemplateInput = {
      subscriptionContractId,
      subscriptionTemplateName:
        MerchantEmailTemplateName.SubscriptionCancelledMerchant,
    };

    await new MerchantSendEmailService().run(shop, merchantTemplateInput);
  }
}
