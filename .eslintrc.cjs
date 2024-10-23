/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    '@remix-run/eslint-config',
    '@remix-run/eslint-config/node',
    '@remix-run/eslint-config/jest-testing-library',
    'prettier',
  ],
  globals: {
    shopify: 'readonly',
  },
  settings: {
    jest: {
      version: 'latest',
    },
  },
  rules: {
    'testing-library/no-await-sync-events': [
      'error',
      {
        eventModules: ['fire-event'],
      },
    ],
  },
  ignorePatterns: [
    'types/*.generated.d.ts',
    'build/*',
    'extensions/*/dist/*',
    'extensions/*/types/*.generated.d.ts',
  ],
};
