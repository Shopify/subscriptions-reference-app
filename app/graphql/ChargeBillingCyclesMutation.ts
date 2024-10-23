const ChargeBillingCycles = `#graphql
mutation ChargeBillingCycles(
  $startDate: DateTime!
  $endDate: DateTime!
  $contractStatus: [SubscriptionContractSubscriptionStatus!]
  $billingCycleStatus: [SubscriptionBillingCycleBillingCycleStatus!]
  $billingAttemptStatus: SubscriptionBillingCycleBillingAttemptStatus
) {
  subscriptionBillingCycleBulkCharge(
    billingAttemptExpectedDateRange: {
      startDate: $startDate
      endDate: $endDate
    }
    filters: {
      contractStatus: $contractStatus,
      billingCycleStatus: $billingCycleStatus,
      billingAttemptStatus: $billingAttemptStatus
    }
  ) {
    job {
      id
    }
    userErrors {
      field
      message
    }
  }
}`;

export default ChargeBillingCycles;
