import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';
import {CustomerSendEmailJob, jobs, TagSubscriptionOrderJob} from '~/jobs';
import {CustomerEmailTemplateName} from '~/services/CustomerSendEmailService';
import type {Jobs, Webhooks} from '~/types';
import {FIRST_ORDER_TAGS} from '~/jobs/tags/constants';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  const {admin_graphql_api_origin_order_id: orderId} = payload;
  if (orderIsFromCheckout(orderId)) {
    const emailParams: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
      shop,
      payload: {
        ...(payload as Webhooks.SubscriptionContractsCreate),
        emailTemplate: CustomerEmailTemplateName.NewSubscription,
      },
    };

    jobs.enqueue(new CustomerSendEmailJob(emailParams));
  }

  const tagParams: Jobs.Parameters<Jobs.TagSubscriptionsOrderPayload> = {
    shop,
    payload: {
      orderId: payload.admin_graphql_api_origin_order_id,
      tags: FIRST_ORDER_TAGS,
    },
  };

  jobs.enqueue(new TagSubscriptionOrderJob(tagParams));

  return new Response();
};

function orderIsFromCheckout(orderId: string | null): boolean {
  return orderId !== null;
}
