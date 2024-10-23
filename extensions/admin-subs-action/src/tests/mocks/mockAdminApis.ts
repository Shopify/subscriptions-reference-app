import {vi} from 'vitest';

import translations from '../../../locales/en.default.json';
import type {GraphQLError} from 'node_modules/@shopify/ui-extensions/build/ts/surfaces/admin/api/standard/standard';

export function mockAdminApis() {
  const mockUseAdminGraphql = vi.hoisted(() => {
    return vi.fn();
  });

  const mockUseExtensionApi = vi.hoisted(() => {
    return vi.fn();
  });

  const mockTranslate = vi.hoisted(() => {
    return vi
      .fn()
      .mockImplementation(
        (
          key: string,
          options: Record<string, string | number> | undefined = {},
        ) => {
          let current: string | Object = translations;

          /**
           * Replaces placeholders in the string with the values from the options
           * @param value - The string to replace placeholders in
           * @param options - A key-value pair of placeholders to replace in the string
           * @returns The string with placeholders replaced
           */
          function handleReplacements(
            value: string,
            options: Record<string, string | number> | undefined = {},
          ) {
            let result = value;
            for (const [optionKey, optionValue] of Object.entries(options)) {
              if (typeof optionValue !== 'undefined') {
                result = result.replace(
                  `{{${optionKey}}}`,
                  optionValue.toString(),
                );
              }
            }

            return result;
          }

          // loop over all parts of the key until the corresponding value in the translation object
          // ends up as either a:
          // - object with a nested "one" and "other" key for pluralization
          // - string
          // then return the string with the replacements made
          for (const keyPart of key.split('.')) {
            if (typeof current[keyPart] === 'object') {
              const isPluralKey =
                options.count !== undefined &&
                typeof current[keyPart]['one'] === 'string' &&
                typeof current[keyPart]['other'] === 'string';

              if (isPluralKey) {
                const count = Number(options.count);

                const valueWithCountReplacement = (
                  count === 1 ? current[keyPart].one : current[keyPart].other
                ).replace('{{count}}', options.count);

                return handleReplacements(valueWithCountReplacement, options);
              }
              current = current[keyPart];
              continue;
            }
            return handleReplacements(current[keyPart], options);
          }
        },
      );
  });

  const mockFormatCurrency = vi.hoisted(() => {
    return vi.fn().mockImplementation(
      (
        value: number | bigint,
        options: {
          inExtensionLocale?: boolean;
        } & Intl.NumberFormatOptions = {},
      ) => {
        const roundedValue = Number(value).toFixed(2);
        return `$${roundedValue}`;
      },
    );
  });

  vi.mock('foundation/api', async () => {
    return {
      ...(await vi.importActual('foundation/api')),
      useExtensionApi: mockUseExtensionApi.mockReturnValue({
        i18n: {
          translate: mockTranslate,
          formatCurrency: mockFormatCurrency,
        },
        close: vi.fn(),
        data: {
          selected: [
            {
              id: 'gid://shopify/Product/12',
            },
          ],
        },
      }),
      useAdminGraphql: mockUseAdminGraphql.mockReturnValue([
        vi.fn(),
        {loading: false, errors: []},
      ]),
    };
  });

  function mockAdminGraphql({
    data,
    loading,
    errors,
  }: {
    data?: Object;
    loading?: boolean;
    errors?: GraphQLError[];
  }) {
    mockUseAdminGraphql.mockReturnValue([
      vi.fn().mockResolvedValue(data),
      {
        data,
        loading: loading ?? false,
        errors: errors ?? [],
      },
    ]);
  }

  function mockExtensionApi(options?: {
    close?: () => void;
    productId?: string;
  }) {
    mockUseExtensionApi.mockReturnValue({
      i18n: {
        translate: mockTranslate,
        formatCurrency: mockFormatCurrency,
      },
      close: close ?? vi.fn(),
      data: {
        selected: [
          {
            id: options?.productId ?? 'gid://shopify/Product/12',
          },
        ],
      },
    });
  }

  return {
    adminGraphql: mockUseAdminGraphql,
    mockAdminGraphql,
    mockExtensionApi,
  };
}
