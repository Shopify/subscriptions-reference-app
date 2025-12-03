import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {DirectApiRequestBody} from '@shopify/ui-extensions/point-of-sale';

import type {GetSellingPlansQuery} from '../../../types/admin.generated';
import SellingPlansQuery from '../../graphql/SellingPlansQuery';

const SHOPIFY_ADMIN_GRAPHQL_ENDPOINT = 'shopify:admin/api/graphql.json';

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    [key: string]: any;
  }>;
}

export async function executeGraphQLQuery<
  TData,
  TVariables = Record<string, any>,
>(query: string, variables?: TVariables): Promise<GraphQLResponse<TData>> {
  const requestBody: DirectApiRequestBody = {
    query,
    variables: variables || {},
  };

  const response = await fetch(SHOPIFY_ADMIN_GRAPHQL_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  return response.json() as Promise<GraphQLResponse<TData>>;
}

export async function querySellingPlans(
  variantId: number,
): Promise<GraphQLResponse<GetSellingPlansQuery>> {
  return executeGraphQLQuery<GetSellingPlansQuery>(SellingPlansQuery, {
    variantId: composeGid('ProductVariant', variantId),
  });
}
