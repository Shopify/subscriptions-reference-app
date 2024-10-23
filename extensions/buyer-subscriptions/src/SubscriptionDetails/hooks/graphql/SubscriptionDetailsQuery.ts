const SubscriptionDetailsQuery = `#graphql
query SubscriptionContract($id: ID!) {
  customer {
    subscriptionContract(id: $id) {
      id
      status
      deliveryPolicy {
        interval
        intervalCount {
          count
          precision
        }
      }
      priceBreakdownEstimate {
        subtotalPrice {
          amount
          currencyCode
        }
        totalTax {
          amount
          currencyCode
        }
        totalShippingPrice {
          amount
          currencyCode
        }
        totalPrice {
          amount
          currencyCode
        }
      }
      upcomingBillingCycles(first: 6) {
        edges {
          node {
            billingAttemptExpectedDate
            skipped
            cycleIndex
          }
        }
      }
      paymentInstrument {
        ... on CustomerCreditCard {
          id
          brand
          lastDigits
          walletType
          expiryMonth
          expiryYear
          billingAddress {
            address1
            city
            countryCode
            provinceCode
            zip
          }
        }
        ... on PaypalBillingAgreement {
          id
          paypalAccountEmail
          billingAddress {
            address1
            city
            countryCode
            provinceCode
            zip
          }
        }
      }
      deliveryMethod {
        ... on SubscriptionDeliveryMethodShipping {
          address {
            address1
            address2
            city
            countryCode
            firstName
            lastName
            phone
            provinceCode
            zip
          }
          shippingOption {
            presentmentTitle
          }
        }
        ... on SubscriptionDeliveryMethodLocalDelivery {
          address {
            address1
            address2
            city
            countryCode
            firstName
            lastName
            phone
            provinceCode
            zip
          }
          localDeliveryOption {
            presentmentTitle
          }
        }
        ... on SubscriptionDeliveryMethodPickup {
          pickupOption {
            pickupAddress {
              address1
              address2
              city
              countryCode
              phone
              zip
              zoneCode
            }
          }
        }
      }
      lines(first: 10) {
        edges {
          node {
            id
            name
            title
            variantTitle
            quantity
            image {
              id
              altText
              url
            }
          }
        }
      }
      orders(first: 5, reverse: true) {
        edges {
          node {
            id
            createdAt
            totalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
}
`;

export default SubscriptionDetailsQuery;
