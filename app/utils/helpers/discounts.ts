import type {SubscriptionManualDiscount} from 'types/admin.types';
import type {SubscriptionContractDraftDiscountsQuery as SubscriptionContractDraftDiscountsQueryData} from 'types/admin.generated';

type graphqlDiscount = NonNullable<
  SubscriptionContractDraftDiscountsQueryData['subscriptionDraft']
>['discounts']['edges'][number]['node'];

export function discountIsManualDiscount(
  discount: graphqlDiscount,
): discount is SubscriptionManualDiscount {
  return 'entitledLines' in discount;
}
