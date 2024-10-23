import {
  createReadableStreamFromReadable,
  type ActionFunctionArgs,
  type AppLoadContext,
  type EntryContext,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {RemixServer} from '@remix-run/react';
import ShopifyFormat from '@shopify/i18next-shopify';
import {createInstance} from 'i18next';
import Backend from 'i18next-fs-backend';
import {isbot} from 'isbot';
import {resolve} from 'node:path';
import {renderToPipeableStream} from 'react-dom/server';
import {I18nextProvider, initReactI18next} from 'react-i18next';
import {PassThrough} from 'stream';

import {logger} from '~/utils/logger.server';
import i18nextServer from './i18n/i18next.server';
import i18nextOptions from './i18n/i18nextOptions';
import {addDocumentResponseHeaders} from './shopify.server';

const ABORT_DELAY = 5_000;

export function handleError(
  error: Error,
  {request: req, params, context}: LoaderFunctionArgs | ActionFunctionArgs,
): void {
  if (error instanceof Error === false) {
    return;
  }

  if (req.signal.aborted) {
    return;
  }

  const {url, method, headers} = req;
  const request = {
    url,
    method,
    headers: Object.fromEntries(headers.entries()),
  };

  const {message} = error;
  logger.error({err: error, request, params, context}, message);
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);

  const i18next = createInstance();
  const lng = await i18nextServer.getLocale(request);
  const ns = i18nextServer.getRouteNamespaces(remixContext);

  await i18next
    .use(initReactI18next)
    .use(ShopifyFormat.default ?? ShopifyFormat)
    .use(Backend)
    .init({
      ...i18nextOptions,
      lng,
      ns,
      backend: {loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json')},
    });

  const callbackName = isbot(request.headers.get('user-agent'))
    ? 'onAllReady'
    : 'onShellReady';

  return new Promise((resolve, reject) => {
    const {pipe, abort} = renderToPipeableStream(
      <I18nextProvider i18n={i18next}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('X-Content-Type-Options', 'nosniff');
          responseHeaders.set('X-Download-Options', 'noopen');
          responseHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');
          responseHeaders.set('Referrer-Policy', 'origin-when-cross-origin');
          responseHeaders.set(
            'Content-Security-Policy',
            "default-src 'self'; \
            script-src 'self' 'unsafe-inline' https://cdn.shopify.com; \
            style-src 'self' 'unsafe-inline' https://cdn.shopify.com; \
            font-src 'self' https://cdn.shopify.com; \
            img-src 'self' data: https://cdn.shopify.com; \
            connect-src 'self' https://atlas.shopifysvc.com; \
            upgrade-insecure-requests",
          );
          responseHeaders.set(
            'Strict-Transport-Security',
            'max-age=631138519; includeSubDomains',
          );

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          logger.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
