import type {ActionFunctionArgs} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export const action = async ({request}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);

  logger.info({topic, shop, payload}, 'Received webhook');

  return new Response('No customer data stored', {status: 200});
};
