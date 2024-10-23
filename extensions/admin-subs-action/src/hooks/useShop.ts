import {useAdminGraphql} from 'foundation/api';
import ShopQuery from '../graphql/ExtensionShopQuery';
import type {
  ShopQuery as ShopQueryData,
  ShopQueryVariables,
} from 'generatedTypes/admin.generated';

export function useShop() {
  const [graphqlQuery, {loading, errors}] = useAdminGraphql<
    ShopQueryData,
    ShopQueryVariables
  >();

  async function getShopInfo() {
    const {data} = await graphqlQuery(ShopQuery, {});
    return data?.shop;
  }

  return {getShopInfo, loading, errors};
}
