import {useAdminGraphql} from 'foundation/api';
import type {
  ExtensionUpdateSellingPlanGroupMutation as ExtensionUpdateSellingPlanGroupMutationData,
  ExtensionUpdateSellingPlanGroupMutationVariables,
} from 'generatedTypes/admin.generated';
import ExtensionUpdateSellingPlanGroup from '../graphql/ExtensionUpdateSellingPlanGroupMutation';

export function useUpdateSellingPlanGroup() {
  const [graphqlMutation, {loading, errors: graphqlErrors}] = useAdminGraphql<
    ExtensionUpdateSellingPlanGroupMutationData,
    ExtensionUpdateSellingPlanGroupMutationVariables
  >();

  async function updateSellingPlanGroup(
    variables: ExtensionUpdateSellingPlanGroupMutationVariables,
  ) {
    const {data} = await graphqlMutation(
      ExtensionUpdateSellingPlanGroup,
      variables,
    );

    let errors: {field: string; message: string}[] = [];

    if (graphqlErrors.length > 0) {
      errors = graphqlErrors.map(({message}) => ({field: '', message}));
    }

    if (data?.sellingPlanGroupUpdate?.userErrors?.length) {
      errors = Array.from(
        new Set<{field: string; message: string}>(
          data.sellingPlanGroupUpdate.userErrors.map(({field, message}) => ({
            field: field?.toString() ?? '',
            message,
          })),
        ),
      );
    }

    return {data, loading, errors};
  }

  return {updateSellingPlanGroup, graphqlLoading: loading};
}
