//
// This file was copied from the Shopify/customer-account-web project to allow us to mock the same i18n behavior in our tests
// https://github.com/Shopify/customer-account-web/blob/main/app/foundation/extensibility/sandbox/i18n/i18n.ts
// If we run into issues with translations in our tests, we should check this file to see if it has been updated, and update it here as well
//
import type {
  ApiForRenderExtension,
  Localization,
  I18nTranslate,
} from '@shopify/ui-extensions-react/customer-account';
import translations from '../../locales/en.default.json';
import orderActionTranslations from '../../../order-action-extension/locales/en.default.json';

interface ExtensionTranslationMap {
  [key: string]: string;
}

class SandboxI18nError extends Error {
  name = 'SandboxI18nError';
}

export function createI18nForSandbox({
  localization,
  translations,
  currency,
}: {
  localization: Localization;
  translations: ExtensionTranslationMap;
  currency: string;
}): ApiForRenderExtension<'customer-account.page.render'>['i18n'] {
  function formatNumber(
    number: number | bigint,
    {
      inExtensionLocale,
      ...numberFormatOptions
    }: {inExtensionLocale?: boolean} & Intl.NumberFormatOptions = {},
  ) {
    // https://github.com/Shopify/checkout-web/issues/8579
    const formatter = new Intl.NumberFormat(
      inExtensionLocale
        ? localization.extensionLanguage.current.isoCode
        : localization.language.current.isoCode,
      numberFormatOptions,
    );

    return formatter.format(number);
  }

  function formatCurrency(
    number: number | bigint,
    {
      inExtensionLocale,
      ...numberFormatOptions
    }: {inExtensionLocale?: boolean} & Intl.NumberFormatOptions = {},
  ) {
    return formatNumber(number, {
      inExtensionLocale,
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      ...numberFormatOptions,
    });
  }

  function formatDate(
    date: Date,
    {
      inExtensionLocale,
      ...dateFormatOptions
    }: {inExtensionLocale?: boolean} & Intl.DateTimeFormatOptions = {},
  ) {
    // https://github.com/Shopify/checkout-web/issues/8579
    return new Intl.DateTimeFormat(
      inExtensionLocale
        ? localization.extensionLanguage.current.isoCode
        : localization.language.current.isoCode,
      dateFormatOptions,
    ).format(date);
  }

  const translate: I18nTranslate = (key, options = {}) => {
    let translation = translations[key];
    let countPlaceholder = false;
    const locale = localization.extensionLanguage.current.isoCode;

    function handleTranslateError(message: string) {
      // eslint-disable-next-line no-console
      console.error(new SandboxI18nError(`translate(): ${message}`));
    }

    if (typeof options.count === 'number') {
      const pluralKey = new Intl.PluralRules(locale).select(options.count);
      const translationKey = `${key}.${pluralKey}`;
      translation = translations[translationKey];

      if (translation === undefined) {
        const otherTranslation = translations[`${key}.other`];

        if (pluralKey !== 'other' && otherTranslation !== undefined) {
          translation = otherTranslation;
          // eslint-disable-next-line no-console
          console.warn(
            new SandboxI18nError(
              `translate(): MISSING PLURALIZATION KEY for locale "${locale}": "${translationKey}". Using fallback key of "${key}.other".`,
            ),
          );
        } else if (typeof translations[key] === 'string') {
          countPlaceholder = true;
          translation = translations[key];
        } else {
          const message = `MISSING PLURALIZATION KEY for locale "${locale}": "${translationKey}"`;
          handleTranslateError(message);

          return message;
        }
      }
    } else if (
      typeof options.count === 'string' &&
      typeof translations[key] === 'string'
    ) {
      translation = translations[key];
    } else if (options.count !== undefined) {
      const message =
        'INCORRECT TYPE for options.count. Must be typeof "number".';
      handleTranslateError(message);

      return message;
    }

    if (translation === undefined) {
      const pluralKeys = [
        `${key}.zero`,
        `${key}.one`,
        `${key}.two`,
        `${key}.few`,
        `${key}.many`,
        `${key}.other`,
      ];
      let message = `MISSING KEY for locale "${locale}": "${key}"`;

      // Detects if the locale key was meant to be used with pluralization
      for (const pluralKey of pluralKeys) {
        if (translations[pluralKey] !== undefined) {
          message = 'MISSING PROPERTY "options.count" for pluralization.';
          handleTranslateError(message);
          break;
        }
      }

      // No plural keys were found, so the error is a missing key
      handleTranslateError(message);

      // Return the message to the UI in hopes that the developer will see it.
      return message as any;
    }

    const pieces: (string | React.ReactElement<any>)[] = [];
    // Creates match groups up to the end of each placeholder.
    const replaceFinder = /(.*?(?={{|$|\n))(?:{{(.+?(?=}}))}})?/g;
    const unusedPlaceholderKeys = new Set(Object.keys(options));
    const unusedPlaceholderKeysErrors: string[] = [];
    let match = replaceFinder.exec(translation);
    let hasComponent = false;

    while (match) {
      if (match.index >= translation.length) {
        break;
      }

      // match[0] - the entire match
      // match[1] - the text before the placeholder
      // match[2] - the placeholder
      const fullMatch = match[0];
      const placeholderMatch = match[2];
      const placeholderKey = placeholderMatch?.trim();
      const lastPiece = pieces.length - 1;
      let textMatch = match[1] || '';
      let matchedComponent = false;

      if (placeholderKey !== undefined) {
        if (unusedPlaceholderKeys.has(placeholderKey)) {
          if (
            typeof options[placeholderKey] === 'string' ||
            typeof options[placeholderKey] === 'number'
          ) {
            textMatch += String(options[placeholderKey]);
          } else if (placeholderMatch !== undefined) {
            // Assume it's a component.
            hasComponent = true;
            matchedComponent = true;
          }

          unusedPlaceholderKeys.delete(placeholderKey);
        } else {
          const message = `MISSING PLACEHOLDER VALUE for locale "${locale}": "options.${placeholderMatch}" is required for "${key}"`;

          handleTranslateError(message);
          pieces.push(fullMatch);
          match = replaceFinder.exec(translation);
          continue;
        }
      }

      if (typeof pieces[lastPiece] === 'string') {
        pieces[lastPiece] += textMatch;
      } else {
        pieces.push(textMatch);
      }

      if (matchedComponent && placeholderKey !== undefined) {
        // We return UI components as is and expect the caller to
        // wrap translate() with useTranslate().
        pieces.push(options[placeholderKey] as any);
      }

      match = replaceFinder.exec(translation);
    }

    for (const placeholderKey of unusedPlaceholderKeys) {
      if (countPlaceholder === false && placeholderKey === 'count') continue;

      unusedPlaceholderKeysErrors.push(`"{{${placeholderKey}}}"`);
    }

    if (unusedPlaceholderKeysErrors.length > 0) {
      const errorType =
        unusedPlaceholderKeysErrors.length === 1
          ? 'MISSING PLACEHOLDER'
          : 'MISSING PLACEHOLDERS';

      handleTranslateError(
        `${errorType} for locale "${locale}": ${unusedPlaceholderKeysErrors.join(
          ', ',
        )} not found in "${key}"`,
      );
    }

    return hasComponent ? pieces : pieces.join('');
  };

  return {
    formatNumber,
    formatCurrency,
    formatDate,
    translate,
  };
}

// createI18nForSandbox needs the translations to be flattened first
function flattenObject(obj: any, parent = '', res = {}) {
  return Object.keys(obj).reduce((acc, key) => {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenObject(obj[key], propName, acc);
    } else {
      acc[propName] = obj[key];
    }
    return acc;
  }, res);
}

export function createMockI18n() {
  const combinedTranslations = {
    ...flattenObject(translations),
    ...flattenObject(orderActionTranslations),
  };

  return createI18nForSandbox({
    localization: {
      language: {current: {isoCode: 'en'}} as any,
      extensionLanguage: {current: {isoCode: 'en'}} as any,
    },
    translations: combinedTranslations,
    currency: 'CAD',
  });
}
