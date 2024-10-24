import type {SubscriptionContractEvent} from '~/types/webhooks';
import {CustomerEmailTemplateName} from '~/services/CustomerSendEmailService';

export const skipSubscriptionContractEvent: SubscriptionContractEvent = {
  admin_graphql_api_id: 'gid://shopify/SubscriptionContract/1',
  cycle_index: 1,
  emailTemplate: CustomerEmailTemplateName.SubscriptionSkipped,
};
