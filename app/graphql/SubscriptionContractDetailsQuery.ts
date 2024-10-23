const SubscriptionContractDetails = `#graphql
query SubscriptionContractDetails($id: ID!) {
  subscriptionContract(id: $id) {
    id
    status
    currencyCode    lines(first: 50) {
      edges {
        node {
          id
          title
          variantTitle
          quantity
          productId
          variantId
          currentPrice {
            currencyCode
            amount
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
    billingPolicy {
      interval
      intervalCount
    }
    nextBillingDate
    deliveryPolicy {
      interval
      intervalCount
    }
    originOrder {
      id
      name
      createdAt
    }
        lastPaymentStatus
    billingAttempts(first: 5) {
      edges {
        node {
          id
        }
      }
    }
    deliveryMethod {
      __typename
      ... on SubscriptionDeliveryMethodShipping {
        shippingOption {
          title
        }
        address{
          address1
          address2
          city
          province
          firstName
          lastName
          provinceCode
          countryCode
          zip
          phone
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
          phone
        }
        address {
          address1
          address2
          city
          province
          firstName
          lastName
          provinceCode
          countryCode
          zip
          phone
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
    }    customer {
      id
      email
      displayName
      email
      addresses {
        id
        formattedArea
        firstName
        lastName
        company
        address1
        address2
        city
        phone
        countryCode: countryCodeV2
        provinceCode
        zip
      }
    }
    customerPaymentMethod(showRevoked: true) {
      id
      revokedAt
      instrument {
        __typename
        ... on CustomerCreditCard {
          brand
          lastDigits
          maskedNumber
          expiryYear
          expiryMonth
          expiresSoon
          source
        }
        ... on CustomerShopPayAgreement {
          lastDigits
          maskedNumber
          expiryYear
          expiryMonth
          expiresSoon
        }
        ... on CustomerPaypalBillingAgreement {
          paypalAccountEmail
        }
      }
    }
  }
}
`;

export default SubscriptionContractDetails;
