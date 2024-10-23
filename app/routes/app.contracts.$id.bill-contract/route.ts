import {json} from '@remix-run/node';
import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';
import SubscriptionBillingCycleChargeIndexMutation from '~/graphql/SubscriptionBillingCycleChargeIndexMutation';
import i18n from '~/i18n/i18next.server';
import {logger} from '~/utils/logger.server';
import type {SubscriptionBillingAttemptInventoryPolicy} from '../../../types/admin.types';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the ContractDetails.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast<{id?: string}>>> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');
  const contractId = composeGid('SubscriptionContract', params.id || '');

  const body = await request.formData();
  const inventoryPolicy = body.get('inventoryPolicy');
  const cycleIndex = body.get('cycleIndex');
  if (!cycleIndex) {
    logger.error('missing cycleIndex in request body', {body});
    return json(toast(t('actions.billContract.error'), {isError: true}));
  }

  const response = await admin.graphql(
    SubscriptionBillingCycleChargeIndexMutation,
    {
      variables: {
        subscriptionContractId: contractId,
        inventoryPolicy:
          inventoryPolicy as SubscriptionBillingAttemptInventoryPolicy,
        index: Number(cycleIndex),
      },
    },
  );

  const {data} = await response.json();
  let billingAttempt =
    data?.subscriptionBillingCycleCharge?.subscriptionBillingAttempt;
  if (!billingAttempt) {
    logger.error(
      'Received invalid response from SubscriptionBillingCycleChargeIndex mutation. Expected property `subscriptionBillingCycleCharge.subscriptionBillingAttempt`, received ',
      {data, contractId},
    );
    return json(toast(t('actions.billContract.error'), {isError: true}));
  }
  const id = billingAttempt.id;
  return json({
    id,
    ...toast(t('actions.billContract.success')),
  });
}

export function shouldRevalidate() {
  return false;
}
