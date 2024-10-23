import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

interface CustomMatchers<R = unknown> {
  toHavePerformedGraphQLOperation(
    expectedOperation: string,
    expectedVariables?: object,
  ): R;
}
