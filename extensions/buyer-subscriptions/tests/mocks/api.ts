import {createMockI18n} from '../../../shared/mocks/i18n';
import translations from '../../locales/en.default.json';
import orderActionTranslations from '../../../order-action-extension/locales/en.default.json';
import {vi} from 'vitest';

/**
 * Mocks the hooks for using the customer graphql and extension APIs.
 * IMPORTANT: IMPORT THIS BEFORE A TESTED COMPONENT IN A TEST FILE OR IT WILL NOT GET CALLED
 * */
export function mockApis() {
  const mockUseExtensionApi = vi.hoisted(() => {
    return vi.fn();
  });

  const mockUseGraphqlApi = vi.hoisted(() => {
    return vi.fn();
  });

  vi.mock('foundation/Api', async (importOriginal) => {
    const original = (await importOriginal()) as any;

    return {
      ...original,
      useExtensionApi: mockUseExtensionApi.mockReturnValue({
        i18n: vi.fn(),
        ui: {
          toast: {
            show: vi.fn(),
          },
          overlay: {
            close: vi.fn(),
          },
        },
        navigation: {
          navigate: vi.fn(),
        },
        localization: {
          extensionLanguage: {
            current: {
              isoCode: 'en',
            },
          },
        },
        orderId: 'gid://shopify/Order/123',
      }),
      useGraphqlApi: mockUseGraphqlApi.mockReturnValue([
        vi.fn(),
        {
          data: {},
          loading: false,
          error: undefined,
          refetchLoading: false,
        },
      ]),
    };
  });

  function mockCustomerApiGraphQL({
    data,
    loading,
    error,
    refetchLoading,
  }: {
    data?: Object;
    loading?: boolean;
    error?: Error;
    refetchLoading?: boolean;
  }) {
    mockUseGraphqlApi.mockReturnValue([
      vi.fn().mockResolvedValue(data),
      {
        data,
        loading: loading ?? false,
        error,
        refetchLoading: refetchLoading ?? false,
      },
    ]);
  }

  function mockExtensionApi(options?: {
    mocks: {closeOverlay?: () => void; showToast?: () => void};
  }) {
    mockUseExtensionApi.mockReturnValue({
      i18n: createMockI18n({...translations, ...orderActionTranslations}),
      ui: {
        toast: {
          show: options?.mocks.showToast ?? vi.fn(),
        },
        overlay: {
          close: options?.mocks.closeOverlay ?? vi.fn(),
        },
      },
      navigation: {
        navigate: vi.fn(),
      },
      localization: {
        extensionLanguage: {
          current: {
            isoCode: 'en',
          },
        },
      },
      orderId: 'gid://shopify/Order/123',
    });
  }

  return {
    customerGraphQL: mockUseGraphqlApi,
    mockCustomerApiGraphQL,
    mockExtensionApi,
  };
}
