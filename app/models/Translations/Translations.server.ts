import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {TFunction} from 'i18next';
import type {
  GetShopLocalesQuery as GetShopLocalesQueryType,
  GetTranslatableResourcesByIdQuery as GetTranslatableResourcesByIdQueryType,
  TranslationsRegisterMutation,
} from 'types/admin.generated';
import GetShopLocales from '~/graphql/ShopLocalesQuery';
import getTranslatableResourcesById from '~/graphql/TranslatableResourcesByIdsQuery';
import translationsRegisterMutation from '~/graphql/TranslationsRegisterMutation';
import i18n from '~/i18n/i18next.server';
import i18nextOptions from '~/i18n/i18nextOptions';
import type {GraphQLClient, ShopLocale, TranslationInput} from '~/types';
import {logger} from '~/utils/logger.server';

export async function getTranslatableResources(
  graphql: GraphQLClient,
  resourceIds: string[],
) {
  const translatableResourcesByIdsResponse = await graphql(
    getTranslatableResourcesById,
    {
      variables: {
        first: 250,
        resourceIds,
      },
    },
  );

  const {
    data: {translatableResourcesByIds},
  } = (await translatableResourcesByIdsResponse.json()) as {
    data: GetTranslatableResourcesByIdQueryType;
  };

  return nodesFromEdges(translatableResourcesByIds.edges);
}

export async function createTranslationFunctions(
  shopLocalesWithoutPrimary: ShopLocale[],
  namespace,
): Promise<{locale: string; t: TFunction}[]> {
  return await Promise.all(
    shopLocalesWithoutPrimary.map(async ({locale}) => ({
      locale,
      t: await i18n.getFixedT(locale, namespace),
    })),
  );
}

export async function registerTranslations(
  graphql: GraphQLClient,
  resourceId: string,
  translations: TranslationInput[],
) {
  const response = await graphql(translationsRegisterMutation, {
    variables: {
      resourceId,
      translations,
    },
  });

  const {data} = (await response.json()) as {
    data: TranslationsRegisterMutation;
  };

  if (!data || data.translationsRegister?.userErrors.length) {
    const userErrors = data?.translationsRegister?.userErrors;
    logger.warn(
      {resourceId, translations, userErrors},
      'Failed to create translations',
    );
  }

  return data;
}

export async function getShopLocales(
  graphql: GraphQLClient,
): Promise<{shopLocalesWithoutPrimary: ShopLocale[]; primaryLocale: string}> {
  const shopLocalesResponse = await graphql(GetShopLocales);
  const availableLocales: String[] = i18nextOptions.supportedLngs;

  const {
    data: {shopLocales},
  } = (await shopLocalesResponse.json()) as {data: GetShopLocalesQueryType};

  const primaryLocale = shopLocales.find((locale) => locale.primary)!.locale;
  const shopLocalesWithoutPrimary = shopLocales
    .filter(
      (locale) => !locale.primary && availableLocales.includes(locale.locale), // Filtering out locales that are not supported by the app and the primary locale
    )
    .sort((a, b) => Number(b.published) - Number(a.published)); // Sorting the list of locales to ensure published languages are translated first

  return {shopLocalesWithoutPrimary, primaryLocale};
}
