import {json} from '@remix-run/node';
import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {authenticate} from '~/shopify.server';
import SubscriptionBillingAttemptQuery from '~/graphql/SubscriptionBillingAttemptQuery';
import {logger} from '~/utils/logger.server';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the ContractDetails.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<{ready: boolean; id?: string}>> {
  const {admin} = await authenticate.admin(request);
  const body = await request.formData();
  const billingAttemptId = (body.get('billingAttemptId') as string) || '';
  const response = await admin.graphql(SubscriptionBillingAttemptQuery, {
    variables: {
      billingAttemptId,
    },
  });

  const {data} = await response.json();
  const ready = data?.subscriptionBillingAttempt?.ready;
  const id = data?.subscriptionBillingAttempt?.id;
  if (!ready || !id) {
    logger.error(
      'Received invalid response from SubscriptionBillingAttemptQuery. Expected properties `subscriptionBillingAttempt.ready` and `subscriptionBillingAttempt.id`, received ',
      {data, billingAttemptId},
    );
    return json({ready: false});
  }
  return json({ready, id});
}

export function shouldRevalidate() {
  return false;
}
