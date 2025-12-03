import {vi} from 'vitest';
import enTranslations from '../../locales/en.default.json';
import {PreactI18n} from 'extensions/pos-extension/src/i18n/config';

// Flattens nested translation object into dot-notation keys
function flattenTranslations(
  obj: Record<string, any>,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value, newKey));
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}

// Create the flattened translations map
const translations = flattenTranslations(enTranslations);

// Create mock translate function with the same translation logic
export const mockTranslate = vi.fn(
  (key: string, replacements?: Record<string, any>) => {
    let translation = translations[key] || key;

    // Handle replacements if provided
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(
          new RegExp(`{{${placeholder}}}`, 'g'),
          String(value),
        );
      });
    }

    return translation;
  },
);

// Create a mock i18n object that only includes the 't' method
export const createMockI18n = (): Pick<PreactI18n, 't'> => ({
  t: mockTranslate as any, // Cast to any to bypass branded type requirements
});

// Export a default mock instance
export const mockI18n = createMockI18n() as PreactI18n;
