const SelectDeliveryOptionMutation = `#graphql
mutation SelectDeliveryMethod(
  $subscriptionContractId: ID!
  $token: String!
  $deliveryMethod: SubscriptionDeliveryMethodInput!
) {
  subscriptionContractSelectDeliveryMethod(
    subscriptionContractId: $subscriptionContractId
    subscriptionDeliveryOptionsResultToken: $token
    deliveryMethodInput: $deliveryMethod
  ) {
    contract {
      id
      deliveryMethod {
        ... on SubscriptionDeliveryMethodShipping {
          shippingOption {
            title
          }
        }
        ... on SubscriptionDeliveryMethodLocalDelivery {
          localDeliveryOption {
            title
          }
        }
        ... on SubscriptionDeliveryMethodPickup {
          pickupOption {
            title
          }
        }
      }
    }
    userErrors {
      code
      field
      message
    }
  }
}
`;

export default SelectDeliveryOptionMutation;
