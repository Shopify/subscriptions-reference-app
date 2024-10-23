import {json} from '@remix-run/node';
import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import i18n from '~/i18n/i18next.server';
import {SubscriptionContractPauseService} from '~/services/SubscriptionContractPauseService';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the ContractDetails.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast>> {
  const {admin, session} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');
  const contractId = composeGid('SubscriptionContract', params.id || '');

  const pauseError = json(toast(t('actions.pause.error'), {isError: true}));

  if (typeof contractId !== 'string') {
    return pauseError;
  }

  try {
    await new SubscriptionContractPauseService(
      admin.graphql,
      session.shop,
      contractId,
    ).run();

    return json(toast(t('actions.pause.success')));
  } catch (e) {
    return pauseError;
  }
}
