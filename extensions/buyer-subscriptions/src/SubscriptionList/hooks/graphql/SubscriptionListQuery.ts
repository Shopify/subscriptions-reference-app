const SubscriptionListQuery = `#graphql
query SubscriptionList($first: Int) {
  customer {
    subscriptionContracts(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          status
          upcomingBillingCycles(first: 6) {
            edges {
              node {
                billingAttemptExpectedDate
                skipped
                cycleIndex
              }
            }
          }
          deliveryPolicy {
            interval
            intervalCount {
              count
              precision
            }
          }
          currencyCode
          deliveryPrice {
            amount
            currencyCode
          }                    orders(first: 1, reverse: true) {
            edges {
              node {
                id
                totalPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          updatedAt
          lines(first: 10) {
            edges {
              node {
                name
                title
                variantTitle
                quantity
                image {
                  id
                  altText
                  url
                }
                lineDiscountedPrice {
                  amount
                  currencyCode
                }              }
            }
          }
        }
      }
    }
  }
}
`;

export default SubscriptionListQuery;
