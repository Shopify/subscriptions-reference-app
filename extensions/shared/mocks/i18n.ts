import type {I18n} from '@shopify/ui-extensions';
import {vi} from 'vitest';

/**
 * Replaces placeholders in the string with the values from the options
 * @param value - The string to replace placeholders in
 * @param options - A key-value pair of placeholders to replace in the string
 * @returns The string with placeholders replaced
 */
function handleOptionsReplacements(
  value: string,
  options: Record<string, string | number> | undefined = {},
) {
  let result = value;
  for (const [optionKey, optionValue] of Object.entries(options)) {
    if (typeof optionValue !== 'undefined') {
      result = result.replace(`{{${optionKey}}}`, optionValue.toString());
    }
  }

  return result;
}

export function createMockI18n(
  translations: Record<string, string | Object>,
): I18n {
  const mockTranslate = vi
    .fn()
    .mockImplementation(
      (
        key: string,
        options: Record<string, string | number> | undefined = {},
      ) => {
        let current: string | Object = translations;

        // handles pluralization for keys such as "deliveryInterval.month.one"
        // or "deliveryInterval.month.other"
        const isCombinedPluralKey =
          (key.endsWith('.one') || key.endsWith('.other')) &&
          options.count !== undefined;

        if (isCombinedPluralKey) {
          // split the key after the first '.'
          // ex: 'deliveryInterval.month.one' -> ['deliveryInterval', 'month.one']
          const keyParts = key.split(/\.(.*)/s);

          const valueWithCountReplacement = current[keyParts[0]][
            keyParts[1]
          ].replace('{{count}}', options.count);

          return handleOptionsReplacements(valueWithCountReplacement, options);
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

              return handleOptionsReplacements(
                valueWithCountReplacement,
                options,
              );
            }
            current = current[keyPart];
            continue;
          }

          return handleOptionsReplacements(current[keyPart], options);
        }
      },
    );

  const mockFormatCurrency = vi
    .fn()
    .mockImplementation((value: number | bigint) => {
      const roundedValue = Number(value).toFixed(2);
      return `$${roundedValue}`;
    });

  const mockFormatDate = vi
    .fn()
    .mockImplementation(
      (date: Date, dateFormatOptions: Intl.DateTimeFormatOptions = {}) => {
        return new Intl.DateTimeFormat('en', dateFormatOptions).format(date);
      },
    );

  const mockFormatNumber = vi
    .fn()
    .mockImplementation(
      (
        value: number,
        numberFormatOptions: Intl.NumberFormatOptions = {},
      ): string => {
        return new Intl.NumberFormat('en', numberFormatOptions).format(value);
      },
    );

  return {
    translate: mockTranslate,
    formatCurrency: mockFormatCurrency,
    formatDate: mockFormatDate,
    formatNumber: mockFormatNumber,
  };
}
