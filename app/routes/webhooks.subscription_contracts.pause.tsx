import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';
import {CustomerSendEmailJob, jobs} from '~/jobs';
import {CustomerEmailTemplateName} from '~/services/CustomerSendEmailService';
import type {Jobs, Webhooks} from '~/types';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  const params: Jobs.Parameters<Webhooks.SubscriptionContractEvent> = {
    shop,
    payload: {
      ...(payload as Webhooks.SubscriptionContractStatusChange),
      emailTemplate: CustomerEmailTemplateName.SubscriptionPaused,
    },
  };

  jobs.enqueue(new CustomerSendEmailJob(params));

  return new Response();
};
