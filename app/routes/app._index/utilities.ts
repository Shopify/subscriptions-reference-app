import type {SubscriptionContractsQueryVariables} from 'types/admin.generated';
import { SubscriptionContractStatus } from '~/types';
import {getPaginationQueryVariablesFromUrl} from '~/utils';

export const ContractsSortKey = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

export const SORT_ORDER_PARAM = 'order';

function getContractsSortVariables(url: URL) {
  const orderParam = url.searchParams.get(SORT_ORDER_PARAM);
  const parts = orderParam?.split(' ');
  const sortKeyParam = parts?.[0];

  const sortKey =
    sortKeyParam && Object.values(ContractsSortKey).includes(sortKeyParam)
      ? sortKeyParam
      : ContractsSortKey.CREATED_AT;
  const reverse = parts?.[1] !== 'asc';

  return {
    sortKey:
      sortKey.toUpperCase() as SubscriptionContractsQueryVariables['sortKey'],
    reverse,
  };
}

function getQueryParams(view: string) {
  if (view == SubscriptionContractStatus.Active) {
    return `status:${view} OR status:${SubscriptionContractStatus.Failed}`
  } else {
    return `status:${view}`
  }
}

export function getContractsQueryVariables(url: URL) {
  const pagninationVariables = getPaginationQueryVariablesFromUrl(url);
  const sortVariables = getContractsSortVariables(url);

  const savedView = url.searchParams.get('savedView');
  const query = savedView ? getQueryParams(savedView.toUpperCase()) : '';

  return {
    ...pagninationVariables,
    ...sortVariables,
    query,
  };
}
