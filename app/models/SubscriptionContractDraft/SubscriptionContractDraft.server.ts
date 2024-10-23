import type {SubscriptionContractUpdateMutation as SubscriptionContractUpdateMutationData} from 'types/admin.generated';
import SubscriptionContractUpdateMutation from '~/graphql/SubscriptionContractUpdateMutation';
import type {GraphQLClient} from '~/types';
import {logger} from '~/utils/logger.server';
import {SubscriptionContractDraft} from './SubscriptionContractDraft';

export async function buildDraftFromContract(
  shopDomain: string,
  contractId: string,
  graphqlClient: GraphQLClient,
): Promise<SubscriptionContractDraft> {
  const createDraftResponse = await graphqlClient(
    SubscriptionContractUpdateMutation,
    {
      variables: {
        contractId,
      },
    },
  );

  const {
    data: {subscriptionContractUpdate},
  } = (await createDraftResponse.json()) as {
    data: SubscriptionContractUpdateMutationData;
  };

  if (
    !subscriptionContractUpdate?.draft?.id ||
    subscriptionContractUpdate.userErrors.length > 0
  ) {
    logger.error(
      {
        shop: shopDomain,
        subscriptionContractId: contractId,
        userErrors: subscriptionContractUpdate?.userErrors || [],
      },
      'Failed to create draft',
    );

    throw new Error(`Unable to create draft for contract id ${contractId}`);
  }

  return new SubscriptionContractDraft(
    shopDomain,
    contractId,
    subscriptionContractUpdate.draft.id,
    graphqlClient,
  );
}
