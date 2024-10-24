import type {ActionFunctionArgs} from '@remix-run/node';
import type {Webhooks} from '~/types';
import {jobs, DeleteBillingScheduleJob} from '~/jobs';
import {authenticate} from '~/shopify.server';
import {logger} from '~/utils/logger.server';
import type {Job} from '~/lib/jobs';

interface ActionResult {
  queueJobs?: Array<Job<any>>;
  response?: Response;
}

interface WebhookActionFunc {
  (shop: string, payload: any): ActionResult;
}

const actionRegistry: Record<string, WebhookActionFunc> = {
  SHOP_REDACT: onShopRedact,
  CUSTOMERS_DATA_REQUEST: onCustomerDataRequest,
  CUSTOMERS_REDACT: onCustomerDataRequest,
};

const skippedEvents = [
  'SELLING_PLAN_GROUPS_UPDATE',
  'SELLING_PLAN_GROUPS_CREATE',
  'SUBSCRIPTION_CONTRACTS_CREATE',
  'SUBSCRIPTION_CONTRACTS_ACTIVATE',
  'SUBSCRIPTION_CONTRACTS_PAUSE',
  'SUBSCRIPTION_CONTRACTS_CANCEL',
  'SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS',
  'SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE',
  'APP_UNINSTALLED',
  'SUBSCRIPTION_BILLING_CYCLES_SKIP',
];

export const action = async ({request, context}: ActionFunctionArgs) => {
  const {topic, shop, payload} = await authenticate.webhook(request);
  context.shop = shop;

  if (skippedEvents.includes(topic)) {
    logger.info({topic, shop, payload}, 'Skipping imperative webhook');
    return new Response('ok', {status: 200});
  }

  logger.info({topic, shop, payload}, 'Received webhook');

  if (!actionRegistry.hasOwnProperty(topic)) {
    throw new Response('Unhandled webhook topic', {status: 404});
  }
  const {queueJobs, response} = actionRegistry[topic](shop, payload);
  queueJobs?.forEach((job) => jobs.enqueue(job));
  return response || new Response();
};

function onShopRedact(
  shop: string,
  payload: Webhooks.ShopRedact,
): ActionResult {
  return {
    queueJobs: [new DeleteBillingScheduleJob({shop, payload})],
    response: new Response('Shop data deletion requested', {status: 200}),
  };
}

function onCustomerDataRequest(): ActionResult {
  return {
    response: new Response('No customer data stored', {status: 200}),
  };
}
