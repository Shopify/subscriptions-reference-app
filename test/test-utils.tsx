import type {RemixStubProps} from '@remix-run/testing';
import {createRemixStub} from '@remix-run/testing';
import {PolarisTestProvider} from '@shopify/polaris';
import {render} from '@testing-library/react';
import {parse} from 'graphql';
import type {ReactElement} from 'react';
import {I18nextProvider} from 'react-i18next';
import {vi} from 'vitest';
import type {ShopContextValue} from '~/context/ShopContext';
import ShopContext from '~/context/ShopContext';
import i18n from './utils/i18nextTest';

import polarisTranslations from '@shopify/polaris/locales/en.json';

/**
 * Mount a component with react testing library
 * and wrap it required app providers for Polaris and I18next
 */
function mountWithAppContext(
  element: ReactElement,
  shopContext: Partial<ShopContextValue> = {},
) {
  return render(
    <ShopContext.Provider
      value={{
        shopId: 91,
        shopifyDomain: 'myshop.myshopify.io',
        currencyCode: 'CAD',
        name: 'My Shop',
        contactEmail: 'noreply@shopify.com',
        ianaTimezone: 'America/Toronto',
        email: 'test@shopify.ca',
        ...shopContext,
      }}
    >
      <I18nextProvider i18n={i18n}>
        <PolarisTestProvider i18n={polarisTranslations}>
          {element}
        </PolarisTestProvider>
      </I18nextProvider>
      ,
    </ShopContext.Provider>,
  );
}

/**
 * Mount one or more routes with a Remix stub
 * making all the Remix functionality available in components.
 * Mount multiple routes to test navigation between routes.
 */
export function mountRemixStubWithAppContext({
  routes,
  context,
  remixStubProps,
  shopContext,
}: {
  routes: Parameters<typeof createRemixStub>[0];
  context?: Parameters<typeof createRemixStub>[1];
  remixStubProps?: RemixStubProps;
  shopContext?: Partial<ShopContextValue>;
}) {
  const RemixStub = createRemixStub(routes, context);

  return mountWithAppContext(<RemixStub {...remixStubProps} />, shopContext);
}

/**
 * Mount a single react component in a Remix & App context
 * Useful when testing a single isolated component
 */
export function mountComponentWithRemixStub(element: ReactElement) {
  return mountRemixStubWithAppContext({
    routes: [
      {
        path: '/',
        Component: () => element,
      },
    ],
  });
}

/**
 * Wait for the passed amount of milliseconds to pass
 * before continuing with test
 */
export async function wait(ms: number = 50) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}

/**
 * Same as wait, but with a more descriptive name
 * to make tests easier to follow
 */
export async function waitForGraphQL() {
  return wait(500);
}

/**
 * A utility for mocking the Shopify server module.
 * Provides mocks for testing routes that call the Admin API.
 * Note: This must be imported before the Shopify module is imported
 * in your tests for it to work.
 */
export function mockShopifyServer() {
  const graphQL = vi.hoisted(() => {
    return vi.fn();
  });

  const webhookMock = vi.hoisted(() => {
    return vi.fn();
  });

  vi.mock('~/shopify.server', async (importOriginal) => {
    const original = (await importOriginal()) as any;

    return {
      ...original,
      authenticate: {
        admin: vi.fn().mockResolvedValue({
          admin: {
            graphql: graphQL.mockResolvedValue(
              new Response(JSON.stringify({})),
            ),
          },
          session: {
            shop: 'shop1.myshopify.io',
          },
        }),
        webhook: webhookMock,
      },
      unauthenticated: {
        admin: vi.fn().mockResolvedValue({
          admin: {
            graphql: graphQL.mockResolvedValue(
              new Response(JSON.stringify({})),
            ),
          },
        }),
      },
    };
  });

  function mockWebhook({
    shop,
    topic,
    payload,
  }: {
    shop: string;
    topic: string;
    payload: object;
  }) {
    webhookMock.mockImplementation(() => {
      return {
        shop,
        topic,
        payload,
      };
    });
  }

  function mockGraphQL(
    mockedResponses: {[key: string]: any},
    mockOnce = false,
  ) {
    const mockedGraphQLImplementation = async (
      query: any,
      options: {variables: any},
    ) => {
      const parsedQuery = parse(query) as any;
      const operationName = parsedQuery.definitions[0].name.value;

      const response = mockedResponses[operationName];

      if (!response) {
        throw new Error(`No mocked response for query: ${operationName}`);
      }

      return new Response(JSON.stringify(response));
    };

    if (mockOnce) {
      graphQL.mockImplementationOnce(mockedGraphQLImplementation);
    } else {
      graphQL.mockImplementation(mockedGraphQLImplementation);
    }

    return graphQL;
  }

  /**
   * Mocks graphql responses in the order they are provided with one call corresponding to one entry in the mock array.
   * @param mockedResponsesArray
   * @param preserveLastResponse Whether or not to keep returning the last response in the array on any subsequent calls
   */
  function sequentiallyMockGraphQL(
    mockedResponsesArray: {[key: string]: any}[],
    preserveLastResponse = true,
  ) {
    const responsesToMockOnce = preserveLastResponse
      ? mockedResponsesArray.slice(0, -1)
      : mockedResponsesArray;

    responsesToMockOnce.forEach((mockedResponses) => {
      mockGraphQL(mockedResponses, true);
    });

    if (preserveLastResponse) {
      mockGraphQL(mockedResponsesArray[mockedResponsesArray.length - 1]);
    }
  }

  return {graphQL, mockWebhook, mockGraphQL, sequentiallyMockGraphQL};
}
