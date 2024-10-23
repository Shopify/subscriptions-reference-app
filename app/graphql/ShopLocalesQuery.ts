const GetShopLocales = `#graphql
query getShopLocales {
  shopLocales {
    primary
    locale
    published
  }
}
`;

export default GetShopLocales;
