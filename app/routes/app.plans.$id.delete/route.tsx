import {
  json,
  redirect,
  type TypedResponse,
  type ActionFunctionArgs,
} from '@remix-run/node';

import {composeGid} from '@shopify/admin-graphql-api-utilities';
import i18n from '~/i18n/i18next.server';

import {deleteSellingPlanGroup} from '~/models/SellingPlan/SellingPlan.server';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {SELLING_PLAN_DELETED_PARAM} from '~/utils/constants';
import {toast} from '~/utils/toast';

// This route is tested in the plan details page where it is used
// Tests can be found in SellingPlanDetails.test.tsx
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast> | null> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.plans.details');
  const planID = params.id;

  if (!planID) {
    return null;
  }

  const result = await deleteSellingPlanGroup(
    admin.graphql,
    composeGid('SellingPlanGroup', planID),
  );

  if (
    result.data.sellingPlanGroupDelete?.userErrors.length ||
    !result.data.sellingPlanGroupDelete?.deletedSellingPlanGroupId
  ) {
    return json(
      toast(t('deleteSellingPlanGroupModal.deleteError'), {isError: true}),
    );
  }

  return redirect(`/app/plans?${SELLING_PLAN_DELETED_PARAM}=true`);
}
