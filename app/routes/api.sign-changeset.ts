import type {ActionFunctionArgs, LoaderFunctionArgs} from '@remix-run/node';
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';
import {authenticate, unauthenticated} from '~/shopify.server';
import {loadPostPurchaseOffer} from '~/models/PostPurchaseOffer.server';
import {fetchOfferDetails, buildChangesForPlan} from '~/offer.server';

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

  const body = await request.json();
  const {referenceId, sellingPlanId} = body;

  const shop = getShopFromRequest(request);

  if (!shop) {
    return cors(
      new Response(JSON.stringify({error: 'Shop required'}), {
        status: 400,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }

  const config = await loadPostPurchaseOffer(shop);

  if (!config.enabled || !config.variantId) {
    return cors(
      new Response(JSON.stringify({error: 'Offer not configured'}), {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }

  const {admin} = await unauthenticated.admin(shop);
  const offer = await fetchOfferDetails(admin.graphql, config);

  if (!offer) {
    return cors(
      new Response(JSON.stringify({error: 'Offer not found'}), {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      }),
    );
  }

  const changes = buildChangesForPlan(offer, sellingPlanId || 'one-time');

  const payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    sub: referenceId,
    changes,
  };

  const token = jwt.sign(payload, process.env.SHOPIFY_API_SECRET!, {
    algorithm: 'HS256',
  });

  return cors(
    new Response(JSON.stringify({token}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    }),
  );
}
