import {json} from '@remix-run/node';
import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import i18n from '~/i18n/i18next.server';
import {SubscriptionContractCancelService} from '~/services/SubscriptionContractCancelService';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the CancelSubscriptionModal.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast<{error?: boolean}>>> {
  const {admin, session} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');
  const contractId = composeGid('SubscriptionContract', params.id || '');

  try {
    await new SubscriptionContractCancelService(
      admin.graphql,
      session.shop,
      contractId,
    ).run();

    return json(toast(t('actions.cancel.success')));
  } catch (e) {
    return json({
      error: true,
      ...toast(t('actions.cancel.error'), {isError: true}),
    });
  }
}
