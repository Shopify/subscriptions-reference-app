import {
  json,
  type TypedResponse,
  type ActionFunctionArgs,
} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import i18n from '~/i18n/i18next.server';
import {skipOrResumeBillingCycle} from '~/services/SubscriptionBillingCycleEditService';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {SkipOrResume} from '~/utils/constants';
import {isNonEmptyString} from '~/utils/helpers/form';
import {toast} from '~/utils/toast';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the UpcomingBillingCyclesCard.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast>> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');
  const body = await request.formData();

  const contractId = composeGid('SubscriptionContract', params.id || '');
  const billingCycleIndex = body.get('billingCycleIndex');
  const skip = body.get('skip');

  const skipError = json(
    toast(t('details.nextOrders.skipError'), {isError: true}),
  );

  if (
    !isNonEmptyString(contractId) ||
    !isNonEmptyString(billingCycleIndex) ||
    !isNonEmptyString(skip) ||
    isNaN(parseInt(billingCycleIndex, 10))
  ) {
    return skipError;
  }

  const response = await skipOrResumeBillingCycle(
    admin.graphql,
    contractId,
    parseInt(billingCycleIndex, 10),
    skip,
  );

  if (!response || response.userErrors?.length > 0) {
    return skipError;
  }

  return json(
    toast(
      skip === SkipOrResume.Skip
        ? t('details.nextOrders.skipSuccess')
        : t('details.nextOrders.resumeSuccess'),
    ),
  );
}
