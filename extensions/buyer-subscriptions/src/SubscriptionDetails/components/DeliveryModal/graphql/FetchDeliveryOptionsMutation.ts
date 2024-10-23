const FetchDeliveryOptionsMutation = `#graphql
mutation FetchDeliveryOptions(
  $deliveryAddress: CustomerAddressInput!
  $subscriptionContractId: ID!
) {
  subscriptionContractFetchDeliveryOptions(
    address: $deliveryAddress
    subscriptionContractId: $subscriptionContractId
  ) {
    deliveryOptionsResult {
      ... on SubscriptionDeliveryOptionsResultSuccess {
        token
        deliveryOptions {
          ... on SubscriptionShippingOption {
            __typename
            code
            title
            presentmentTitle
            description
            phoneRequired
            price {
              amount
              currencyCode
            }
          }
          ... on SubscriptionPickupOption {
            __typename
            code
            title
            locationId
            presentmentTitle
            description
            phoneRequired
            pickupTime
            pickupAddress {
              address1
              address2
              city
              countryCode
              zoneCode
              zip
              phone
            }
            price {
              amount
              currencyCode
            }
          }
          ... on SubscriptionLocalDeliveryOption {
            __typename
            code
            title
            presentmentTitle
            description
            phoneRequired
            price {
              amount
              currencyCode
            }
          }
        }
      }
      ... on SubscriptionDeliveryOptionsResultFailure {
        message
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

export default FetchDeliveryOptionsMutation;
