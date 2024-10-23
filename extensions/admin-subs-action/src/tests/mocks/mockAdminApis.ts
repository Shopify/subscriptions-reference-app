import {vi} from 'vitest';

import translations from '../../../locales/en.default.json';
import type {GraphQLError} from 'node_modules/@shopify/ui-extensions/build/ts/surfaces/admin/api/standard/standard';
import {createMockI18n} from '../../../../shared/mocks/i18n';
export function mockAdminApis() {
  const mockUseAdminGraphql = vi.hoisted(() => {
    return vi.fn();
  });

  const mockUseExtensionApi = vi.hoisted(() => {
    return vi.fn();
  });

  vi.mock('foundation/api', async () => {
    return {
      ...(await vi.importActual('foundation/api')),
      useExtensionApi: mockUseExtensionApi.mockReturnValue({
        i18n: vi.fn(),
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
      vi.fn().mockResolvedValue({data}),
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
    sellingPlanGroupId?: string;
  }) {
    mockUseExtensionApi.mockReturnValue({
      i18n: createMockI18n(translations),
      close: close ?? vi.fn(),
      data: {
        selected: [
          {
            id: options?.productId ?? 'gid://shopify/Product/12',
            sellingPlanId: options?.sellingPlanGroupId ?? undefined,
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
