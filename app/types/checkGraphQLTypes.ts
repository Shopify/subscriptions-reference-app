/* eslint-disable @typescript-eslint/no-unused-vars */
import ShopQuery from '~/graphql/ShopQuery';
import type {GraphQLClient} from '.';

// This function ensures that our graphql responses are being typed automatically.
// Sometimes package updates can break the automatic typing if all the the right
// dependencies are not updated together.
// This function is not used in our codebase.
async function checkGraphQLTypes(graphql: GraphQLClient) {
  const response = await graphql(ShopQuery);
  const json = await response.json();
  const data = json.data;

  // If data is of type `any`, then the graphql types are not being generated correctly.
  // Here we are expecting an error because `data` should be of type `ShopQuery`.
  // If this is erroring, Check that `@shopify/admin-api-client` and `@shopify/api-codegen-preset`
  // are up to date.
  // @ts-expect-error
  const check: string = data;
}
