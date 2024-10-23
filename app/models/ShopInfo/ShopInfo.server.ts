import type {GraphQLClient, ShopInfo} from '~/types';
import ShopQuery from '~/graphql/ShopQuery';

export async function getShopInfos(graphql: GraphQLClient): Promise<{
  shop: ShopInfo;
}> {
  const response = await graphql(ShopQuery);

  const {data} = await response.json();

  if (!data) {
    throw new Error('Shop info not found');
  }

  return {
    shop: {
      ...data.shop,
    },
  };
}
