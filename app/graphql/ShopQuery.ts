const ShopQuery = `#graphql
query Shop {
  shop {
    id
    name
    ianaTimezone
        primaryDomain {
      url
    }
    myshopifyDomain
    currencyCode
    contactEmail
    email
  }
}
`;

export default ShopQuery;
