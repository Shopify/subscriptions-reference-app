import type {SubscriptionBillingCycleScheduleEditMutation} from 'types/admin.generated';
import type {SubscriptionBillingCycleScheduleEditInputScheduleEditReason} from 'types/admin.types';
import SubscriptionBillingCycleScheduleEdit from '~/graphql/SubscriptionBillingCycleScheduleEditMutation';
import type {GraphQLClient} from '~/types';

export async function skipOrResumeBillingCycle(
  graphql: GraphQLClient,
  subscriptionContractId: string,
  billingCycleIndex: number,
  skip: string,
) {
  const response = await graphql(SubscriptionBillingCycleScheduleEdit, {
    variables: {
      billingCycleInput: {
        contractId: subscriptionContractId,
        selector: {
          index: billingCycleIndex,
        },
      },
      input: {
        reason:
          'MERCHANT_INITIATED' as SubscriptionBillingCycleScheduleEditInputScheduleEditReason,
        skip: skip === 'skip',
      },
    },
  });

  const error = new Error(
    `Failed to skip or resume billing cycle for contract: ${subscriptionContractId}`,
  );

  try {
    const {
      data: {subscriptionBillingCycleScheduleEdit},
    } = (await response.json()) as {
      data: SubscriptionBillingCycleScheduleEditMutation;
    };

    if (!subscriptionBillingCycleScheduleEdit) {
      throw error;
    }

    return subscriptionBillingCycleScheduleEdit;
  } catch (e) {
    throw error;
  }
}
