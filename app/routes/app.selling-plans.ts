import type {LoaderFunctionArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {authenticate} from '~/shopify.server';

const SELLING_PLANS_QUERY = `#graphql
  query ProductSellingPlans($id: ID!) {
    product(id: $id) {
      sellingPlanGroups(first: 5) {
        nodes {
          sellingPlans(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
`;

export async function loader({request}: LoaderFunctionArgs) {
  const {admin} = await authenticate.admin(request);

  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');

  if (!productId) {
    return json({sellingPlans: []});
  }

  const productGid = productId.startsWith('gid://')
    ? productId
    : `gid://shopify/Product/${productId}`;

  try {
    const response = await admin.graphql(SELLING_PLANS_QUERY, {
      variables: {id: productGid},
    });
    const {data} = await response.json();

    const sellingPlans: {id: string; name: string}[] = [];
    for (const group of data?.product?.sellingPlanGroups?.nodes || []) {
      for (const plan of group.sellingPlans?.nodes || []) {
        sellingPlans.push({
          id: plan.id.replace('gid://shopify/SellingPlan/', ''),
          name: plan.name,
        });
      }
    }

    return json({sellingPlans});
  } catch (e) {
    console.error('Failed to fetch selling plans:', e);
    return json({sellingPlans: []});
  }
}
