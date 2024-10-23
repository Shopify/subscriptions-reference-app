import type {ShopQuery as ShopQueryType} from 'types/admin.generated';
import type {GraphQLClient, ShopInfo} from '~/types';
import ShopQuery from '~/graphql/ShopQuery';

export async function getShopInfos(graphql: GraphQLClient): Promise<{
  shop: ShopInfo;
}> {
  const response = await graphql(ShopQuery);

  const {data} = (await response.json()) as {data: ShopQueryType};

  return {
    shop: data.shop ?? '',
  };
}
