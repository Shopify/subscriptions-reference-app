const SubscriptionBillingCycleScheduleEdit = `#graphql
mutation SubscriptionBillingCycleScheduleEdit($billingCycleInput: SubscriptionBillingCycleInput!, $input: SubscriptionBillingCycleScheduleEditInput!) {
  subscriptionBillingCycleScheduleEdit(
    billingCycleInput: $billingCycleInput,
    input: $input
  ) {
    billingCycle {
      skipped
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default SubscriptionBillingCycleScheduleEdit;
