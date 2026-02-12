import type {ActionFunctionArgs, LoaderFunctionArgs} from '@remix-run/node';
import jwt from 'jsonwebtoken';
import {authenticate, unauthenticated} from '~/shopify.server';
import {loadPostPurchaseOffer} from '~/models/PostPurchaseOffer.server';
import {fetchOfferDetails} from '~/offer.server';

function getShopFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.decode(token) as {
      input_data?: {shop?: {domain?: string}};
    } | null;
    return decoded?.input_data?.shop?.domain || null;
  } catch {
    return null;
  }
}

export async function loader({request}: LoaderFunctionArgs) {
  const {cors} = await authenticate.public.checkout(request);
  return cors(new Response(null, {status: 204}));
}

export async function action({request}: ActionFunctionArgs) {
  const {cors} = await authenticate.public.checkout(request);

  const shop = getShopFromRequest(request);

  if (!shop) {
    return cors(
      new Response(JSON.stringify({offers: []}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }

  const config = await loadPostPurchaseOffer(shop);

  if (!config.enabled || !config.variantId) {
    return cors(
      new Response(JSON.stringify({offers: []}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }

  try {
    const {admin} = await unauthenticated.admin(shop);
    const offer = await fetchOfferDetails(admin.graphql, config);

    const offers = offer ? [offer] : [];

    return cors(
      new Response(JSON.stringify({offers}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  } catch (error) {
    console.error('[api.offer] Error:', error);
    return cors(
      new Response(JSON.stringify({offers: [], error: String(error)}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }
}
