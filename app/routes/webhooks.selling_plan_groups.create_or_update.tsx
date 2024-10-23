import type {ActionFunctionArgs} from '@remix-run/node';
import {CreateSellingPlanTranslationsJob, jobs} from '~/jobs';
import {authenticate} from '~/shopify.server';
import type {Webhooks} from '~/types';
import {logger} from '~/utils/logger.server';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  jobs.enqueue(
    new CreateSellingPlanTranslationsJob({
      shop,
      payload: payload as Webhooks.SellingPlanGroups,
    }),
  );

  return new Response();
};
