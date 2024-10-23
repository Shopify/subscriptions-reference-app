import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';
import {DeleteBillingScheduleJob, jobs} from '~/jobs';
import type {Webhooks} from '~/types';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  jobs.enqueue(
    new DeleteBillingScheduleJob({
      shop,
      payload: payload as Webhooks.ShopRedact,
    }),
  );

  return new Response('Shop data deletion requested', {status: 200});
};
