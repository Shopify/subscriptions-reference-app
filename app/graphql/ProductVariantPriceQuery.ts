const ProductVariantPrice = `#graphql
query ProductVariantPrice($id: ID!) {
  productVariant(id: $id) {
    id
    price
  }
}
`;

export default ProductVariantPrice;
