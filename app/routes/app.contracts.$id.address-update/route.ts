import {
  json,
  type TypedResponse,
  type ActionFunctionArgs,
} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import i18n from '~/i18n/i18next.server';
import {buildDraftFromContract} from '~/models/SubscriptionContractDraft/SubscriptionContractDraft.server';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the CustomerAddressModal.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast<{error?: boolean}>>> {
  const t = await i18n.getFixedT(request, 'app.contracts');
  const body = await request.formData();
  const {admin, session} = await authenticate.admin(request);
  const shopDomain = session.shop;
  const contractId = composeGid('SubscriptionContract', params.id || '');
  const address = body.get('address') as string;
  const deliveryMethodName = body.get('deliveryMethodName') as string;

  const updateAddressError = json({
    error: true,
    ...toast(t('edit.actions.updateAddress.error'), {isError: true}),
  });

  if (!address || !deliveryMethodName) {
    return updateAddressError;
  }

  const addressObject = JSON.parse(address);

  const draft = await buildDraftFromContract(
    shopDomain,
    contractId,
    admin.graphql,
  );

  const result = await draft.updateAddress(addressObject, deliveryMethodName);

  if (!result) {
    return updateAddressError;
  }

  const draftCommitted = await draft.commit();

  if (!draftCommitted) {
    return updateAddressError;
  }

  return json(toast(t('edit.actions.updateAddress.success')));
}
