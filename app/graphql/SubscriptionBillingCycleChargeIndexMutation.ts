const SubscriptionBillingCycleChargeIndexMutation = `#graphql
mutation SubscriptionBillingCycleChargeIndexMutation(
  $subscriptionContractId: ID!
  $inventoryPolicy: SubscriptionBillingAttemptInventoryPolicy = PRODUCT_VARIANT_INVENTORY_POLICY
  $index: Int!
) {
  subscriptionBillingCycleCharge(
    subscriptionContractId: $subscriptionContractId
    inventoryPolicy: $inventoryPolicy
    billingCycleSelector: {
      index: $index
    }
  ) {
    subscriptionBillingAttempt {
      id
      ready
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;

export default SubscriptionBillingCycleChargeIndexMutation;
