import type {SellingPlanGroupSortKeys} from 'types/admin.types';
import type {SellingPlanGroupListItem} from '~/types/plans';
import {getPaginationQueryVariablesFromUrl} from '~/utils';

export const SellingPlanGroupsSortKey = {
  CREATED_AT: 'CREATED_AT',
  UPDATED_AT: 'UPDATED_AT',
} as const;

export const SORT_ORDER_PARAM = 'order';

export const getSellingPlanGroupsQueryVariables = (url: URL) => {
  const paginationQueryVariables = getPaginationQueryVariablesFromUrl(url);
  const sellingPlanGroupsSortVariables = getSellingPlanGroupsSortVariables(url);

  return {
    ...paginationQueryVariables,
    ...sellingPlanGroupsSortVariables,
  };
};

const getSellingPlanGroupsSortVariables = (url: URL) => {
  const selectedSort = getSortSelectedFromParam(
    url.searchParams.get(SORT_ORDER_PARAM),
  );
  const [sortKey, direction] = selectedSort[0].split(' ');
  const reverse = direction === 'asc' ? false : true;

  return {
    sortKey: sortKey as SellingPlanGroupSortKeys,
    reverse,
  };
};

export const getSortSelectedFromParam = (param: string | null): string[] => {
  const defaultSort = `${SellingPlanGroupsSortKey.CREATED_AT} desc`;
  if (!param) return [defaultSort];

  const [sortKeyParam, sortDirectionParam] = param.split(' ');

  const sortKeyValid =
    sortKeyParam &&
    Object.values(SellingPlanGroupsSortKey).some(
      (key) => key === sortKeyParam.toUpperCase(),
    );

  const sortDirectionValid =
    sortDirectionParam && ['asc', 'desc'].includes(sortDirectionParam);

  return sortKeyValid && sortDirectionValid
    ? [`${sortKeyParam.toUpperCase()} ${sortDirectionParam}`]
    : [defaultSort];
};

export function getSellingPlanGroupIds(
  sellingPlanGroups: SellingPlanGroupListItem[],
) {
  return sellingPlanGroups.map((sellingPlanGroup) => {
    return {
      id: sellingPlanGroup.id,
    };
  });
}
