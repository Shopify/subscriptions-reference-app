import {useEffect, useState} from 'react';
import {useAdminGraphql} from 'foundation/api';
import type {
  ExtensionSellingPlanGroupDetailsQuery as ExtensionSellingPlanGroupDetailsQueryData,
  ExtensionSellingPlanGroupDetailsQueryVariables,
} from 'generatedTypes/admin.generated';
import ExtensionSellingPlanGroupDetailsQuery from '../graphql/ExtensionSellingPlanGroupDetailsQuery';

export function useSellingPlanGroupDetails({id}: {id: string}) {
  const [graphqlQuery, {loading}] = useAdminGraphql<
    ExtensionSellingPlanGroupDetailsQueryData,
    ExtensionSellingPlanGroupDetailsQueryVariables
  >();
  const [sellingPlanGroup, setSellingPlanGroup] =
    useState<ExtensionSellingPlanGroupDetailsQueryData['sellingPlanGroup']>();

  useEffect(() => {
    async function getSellingPlanGroupDetails(
      variables: ExtensionSellingPlanGroupDetailsQueryVariables,
    ) {
      if (!id) {
        return;
      }

      const {data} = await graphqlQuery(
        ExtensionSellingPlanGroupDetailsQuery,
        variables,
      );

      if (!data?.sellingPlanGroup) {
        throw new Error('Selling plan group not found');
      }

      setSellingPlanGroup(data.sellingPlanGroup);
    }

    getSellingPlanGroupDetails({id});
  }, [id]);

  return {sellingPlanGroup, loading};
}
