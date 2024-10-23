const SubscriptionContractEditDetails = `#graphql
query SubscriptionContractEditDetails($id: ID!) {
  subscriptionContract(id: $id) {
    id
    status
    currencyCode
    lines(first: 50) {
      edges {
        node {
          id
          title
          variantTitle
          quantity
          productId
          variantId
          currentPrice{
            amount
            currencyCode
          }
          lineDiscountedPrice {
            currencyCode
            amount
          }
          variantImage {
            altText
            url
          }
          pricingPolicy {
            basePrice {
              currencyCode
              amount
            }
            cycleDiscounts {
              computedPrice {
                amount
                currencyCode
              }
              afterCycle
              adjustmentType
              adjustmentValue {
                ... on MoneyV2 {
                  amount
                  currencyCode
                }
                ... on SellingPlanPricingPolicyPercentageValue {
                  percentage
                }
              }
            }
          }
        }
      }
    }
    deliveryPolicy {
      interval
      intervalCount
    }
    deliveryMethod {
      __typename
      ... on SubscriptionDeliveryMethodShipping {
        shippingOption {
          title
        }
      }
      ... on SubscriptionDeliveryMethodPickup {
        pickupOption {
          title
        }
      }
      ... on SubscriptionDeliveryMethodLocalDelivery {
        localDeliveryOption {
          title
        }
      }
    }
        deliveryPrice {
      amount
      currencyCode
    }
    discounts(first: 10) {
      edges {
        node {
          id
          title
          targetType
        }
      }
    }  }
}
`;

export default SubscriptionContractEditDetails;
