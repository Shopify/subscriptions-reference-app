import type {ActionFunctionArgs, AppLoadContext} from '@remix-run/node';
import type {Jobs} from '~/types';

import {json} from '@remix-run/node';
import {jobs} from '~/jobs';

type JobPayload = {
  jobName: string;
  parameters: Jobs.Parameters<unknown>;
};

export async function action({request, context}: ActionFunctionArgs) {
  await addShopToContext(request, context);

  try {
    await jobs.execute(request);

    return json({status: 'success'}, {status: 200});
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    throw json({status: 'failure', error: error.message}, {status: 500});
  }
}

/**
 * Extracts the shop domain from the job payload (if present) and adds it to the context. Used in `handleError` for
 * logging and error reporting to Bugsnag, to provide additional context about errors.
 *
 * @param request the Request containing the job payload
 * @param context the app context to modify
 */
async function addShopToContext(
  request: Request,
  context: AppLoadContext,
): Promise<void> {
  const payload: JobPayload = await request.clone().json();
  const {
    parameters: {shop},
  } = payload;

  shop && (context.shop = shop);
}
