import type {Jobs, Webhooks} from '~/types';

import {Job} from '~/lib/jobs';
import type {CustomerEmailTemplateInput} from '~/services/CustomerSendEmailService';
import {CustomerSendEmailService} from '~/services/CustomerSendEmailService';
import {getContractCustomerId} from '~/models/SubscriptionContract/SubscriptionContract.server';

export class CustomerSendEmailJob extends Job<
  Jobs.Parameters<Webhooks.SubscriptionContractEvent>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;

    let {
      admin_graphql_api_id: subscriptionContractId,
      emailTemplate: subscriptionTemplateName,
      admin_graphql_api_customer_id: customerId,
      cycle_index: billingCycleIndex,
    } = payload;

    if (!customerId) {
      customerId = await getContractCustomerId(shop, subscriptionContractId);
    }

    const templateInput: CustomerEmailTemplateInput = {
      subscriptionContractId,
      subscriptionTemplateName,
    };

    if (billingCycleIndex) {
      templateInput.billingCycleIndex = billingCycleIndex;
    }
    await new CustomerSendEmailService().run(shop, customerId, templateInput);
  }
}
