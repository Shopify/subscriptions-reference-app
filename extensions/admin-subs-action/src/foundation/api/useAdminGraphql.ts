import {useState} from 'react';
import {useExtensionApi} from './useExtensionApi';
import type {GraphQLError} from 'node_modules/@shopify/ui-extensions/build/ts/surfaces/admin/api/standard/standard';
import {useExtensionTarget} from 'foundation/AdminExtensionContext';

type AdminGraphql<TData, TVariables> = [
  (query: string, variables: TVariables) => Promise<{data?: TData}>,
  {loading: boolean; errors: GraphQLError[]},
];

export function useAdminGraphql<TData, TVariables>(): AdminGraphql<
  TData,
  TVariables
> {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<GraphQLError[]>([]);
  const extensionTarget = useExtensionTarget();

  const {query: adminGraphqlQuery} = useExtensionApi({
    extensionTarget,
  });

  async function adminGraphql<TData, TVariables>(
    query: string,
    variables: TVariables,
  ): Promise<{data?: TData}> {
    setLoading(true);

    const {data, errors} = await adminGraphqlQuery<TData, TVariables>(query, {
      variables,
    });

    setErrors(errors ?? []);
    setLoading(false);

    return {data};
  }

  return [adminGraphql, {loading, errors: errors ?? []}];
}
