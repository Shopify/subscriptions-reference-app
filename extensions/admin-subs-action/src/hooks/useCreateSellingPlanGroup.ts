import {useAdminGraphql} from 'foundation/api';
import type {
  ExtensionCreateSellingPlanGroupMutation as ExtensionCreateSellingPlanGroupMutationData,
  ExtensionCreateSellingPlanGroupMutationVariables,
} from 'generatedTypes/admin.generated';
import ExtensionCreateSellingPlanGroup from '../graphql/ExtensionCreateSellingPlanGroupMutation';

export function useCreateSellingPlanGroup() {
  const [graphqlMutation, {loading, errors: graphqlErrors}] = useAdminGraphql<
    ExtensionCreateSellingPlanGroupMutationData,
    ExtensionCreateSellingPlanGroupMutationVariables
  >();

  async function createSellingPlanGroup(
    variables: ExtensionCreateSellingPlanGroupMutationVariables,
  ) {
    const {data} = await graphqlMutation(
      ExtensionCreateSellingPlanGroup,
      variables,
    );

    let errors: {field: string; message: string}[] = [];

    if (graphqlErrors.length > 0) {
      errors = graphqlErrors.map(({message}) => ({field: '', message}));
    }

    if (data?.sellingPlanGroupCreate?.userErrors?.length) {
      errors = Array.from(
        new Set<{field: string; message: string}>(
          data.sellingPlanGroupCreate.userErrors.map(({field, message}) => ({
            field: field?.toString() ?? '',
            message,
          })),
        ),
      );
    }

    return {data, loading, errors};
  }

  return {createSellingPlanGroup, graphqlLoading: loading};
}
