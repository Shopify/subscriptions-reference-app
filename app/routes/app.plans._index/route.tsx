import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useLoaderData, useNavigate, useSearchParams} from '@remix-run/react';
import {
  Box,
  Card,
  Divider,
  EmptyState,
  Page,
  Text,
  Button,
} from '@shopify/polaris';
import {PlusCircleIcon} from '@shopify/polaris-icons';
import {useTranslation} from 'react-i18next';
import type {ValidationErrorResponseData} from '@rvf/remix';
import {TablePagination} from '~/components';
import i18n from '~/i18n/i18next.server';
import {
  deleteSellingPlanGroup,
  getSellingPlanGroups,
} from '~/models/SellingPlan/SellingPlan.server';
import {authenticate} from '~/shopify.server';
import type {PaginationInfo, WithToast} from '~/types';
import type {SellingPlanGroupListItem} from '~/types/plans';
import {isRejected} from '~/utils/typeGuards/promises';
import SellingPlansTable from './components/SellingPlansTable/SellingPlansTable';
import {getSellingPlanGroupsQueryVariables} from './utilities';
import {useEffect} from 'react';
import {SELLING_PLAN_DELETED_PARAM} from '~/utils/constants';

import {Footer} from '~/components/Footer';

import {toast} from '~/utils/toast';
import {useToasts} from '~/hooks';

export const handle = {
  i18n: 'app.plans',
};

interface SellingPlanGroupsLoaderData {
  sellingPlanGroups: SellingPlanGroupListItem[];
  sellingPlanGroupPageInfo: PaginationInfo;
}

export async function loader({
  request,
}): Promise<WithToast<SellingPlanGroupsLoaderData>> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.plans');
  const url = new URL(request.url);

  const {sellingPlanGroups, pageInfo: sellingPlanGroupPageInfo} =
    await getSellingPlanGroups(admin.graphql, {
      ...getSellingPlanGroupsQueryVariables(url),
    });

  let deletedToast = url.searchParams.get(SELLING_PLAN_DELETED_PARAM)
    ? toast(t('table.deletePlan.toast.success.one'))
    : undefined;

  return {
    sellingPlanGroups,
    sellingPlanGroupPageInfo,
    ...deletedToast,
  };
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<Partial<WithToast<ValidationErrorResponseData>>>
> {
  const body = await request.formData();
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.plans');
  const sellingPlanGroupIds: string[] = String(body.get('ids'))?.split(',');

  const errorResponse = json(
    toast(
      t('table.deletePlan.toast.failed', {
        count: sellingPlanGroupIds?.length || 0,
      }),
      {isError: true},
    ),
    {status: 500},
  );

  if (!sellingPlanGroupIds) {
    return errorResponse;
  }

  const response = await Promise.allSettled(
    sellingPlanGroupIds.map(async (id: string) => {
      await deleteSellingPlanGroup(admin.graphql, id);
    }),
  );

  if (response.some(isRejected)) return errorResponse;

  return json(
    toast(
      t('table.deletePlan.toast.success', {count: sellingPlanGroupIds.length}),
      {isError: false},
    ),
  );
}

export default function Index() {
  const {sellingPlanGroups, sellingPlanGroupPageInfo} =
    useLoaderData<typeof loader>();
  const {t, i18n} = useTranslation('app.plans');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useToasts();

  const shouldShowPagination =
    sellingPlanGroupPageInfo.hasPreviousPage ||
    sellingPlanGroupPageInfo.hasNextPage;

  useEffect(() => {
    searchParams.delete(SELLING_PLAN_DELETED_PARAM);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  return (
    <Page
      title={t('page.title')}
      primaryAction={
        sellingPlanGroups.length > 0 ? (
          <Button
            variant="primary"
            onClick={() => navigate('/app/plans/create')}
            icon={PlusCircleIcon}
            accessibilityLabel={t('page.accessibilityLabel')}
          >
            {t('page.createPlan')}
          </Button>
        ) : null
      }
    >
      <Box paddingBlockEnd="200" paddingBlockStart="200" width="100%">
        {sellingPlanGroups.length === 0 ? (
          <Card>
            <EmptyState
              heading={t('emptyState.title')}
              image="/images/empty-subscriptions-list-state.png"
              action={{
                content: t('emptyState.action'),
                onAction: () => navigate('/app/plans/create'),
                icon: PlusCircleIcon,
                accessibilityLabel: t('page.accessibilityLabel'),
              }}
            >
              <Text as="p" variant="bodyMd">
                {t('emptyState.description')}
              </Text>
            </EmptyState>
          </Card>
        ) : (
          <>
            <Card padding="0">
              <SellingPlansTable sellingPlanGroups={sellingPlanGroups} />
            </Card>
            {shouldShowPagination && (
              <>
                <Divider />
                <TablePagination pagination={sellingPlanGroupPageInfo} />
              </>
            )}
          </>
        )}
      </Box>
      <Footer
        page="plans"
        link={`https://help.shopify.com/${i18n.language}/manual/products/purchase-options/shopify-subscriptions/setup`}
      />
    </Page>
  );
}
