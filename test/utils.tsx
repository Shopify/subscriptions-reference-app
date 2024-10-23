import {type DataFunctionArgs, type LoaderFunction} from '@remix-run/node';
import shopify from '../app/shopify.server';
import {getJwt} from './utils/getJwt';
import {setUpValidSession} from './utils/setup-valid-session';

import {APP_URL, BASE64_HOST, TEST_SHOP} from './constants';

export const testLoader = async (
  loader: LoaderFunction,
  options?: Partial<DataFunctionArgs>,
) => {
  const response = (await loader({
    request: new Request(APP_URL),
    context: {},
    params: {},
    ...options,
  })) as any;

  return await response.json();
};

export const testLoaderWithAuth = async (
  loader: LoaderFunction,
  options?: Partial<DataFunctionArgs>,
) => {
  await setUpValidSession(shopify.sessionStorage);
  const {token} = getJwt();

  const response = (await loader({
    request: new Request(
      `${APP_URL}?embedded=1&shop=${TEST_SHOP}&host=${BASE64_HOST}&id_token=${token}`,
    ),
    context: {},
    params: {},
    ...options,
  })) as any;

  return await response.json();
};
