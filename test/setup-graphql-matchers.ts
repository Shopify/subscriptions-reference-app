import {parse} from 'graphql';
import {isMatch} from 'lodash';
import {expect} from 'vitest';

expect.extend({
  toHavePerformedGraphQLOperation(
    received,
    expectedOperation,
    expectedVariables,
  ) {
    const calls = received.mock.calls;

    const parsedExpectedOperation = parse(expectedOperation) as any;
    const expectedOperationName =
      parsedExpectedOperation.definitions[0].name.value;

    for (const call of calls) {
      const [operation, variables] = call;

      if (
        operation === expectedOperation &&
        isMatch(variables, expectedVariables)
      ) {
        return {
          pass: true,
          message: () =>
            // Message is only displayed when matcher is called with `.not`
            `Expected not to have performed GraphQL operation ${expectedOperationName} with variables but matching operation was found.`,
        };
      }
    }

    for (const call of calls) {
      const [operation, variables] = call;

      if (operation === expectedOperation) {
        if (!expectedVariables) {
          return {
            pass: true,
            message: () =>
              // This message is only displayed when matcher is called with `.not`
              `Expected not to have performed GraphQL operation ${expectedOperationName} but did.`,
          };
        }

        if (isMatch(variables, expectedVariables)) {
          return {
            pass: true,
            message: () =>
              // Message is only displayed when matcher is called with `.not`
              `Expected not to have performed GraphQL operation ${expectedOperationName} but matching operation was found.`,
          };
        }

        return {
          pass: false,
          message: () =>
            `Performed expected GraphQL operation ${expectedOperationName} but variables did not match.`,
          expected: expectedVariables,
          actual: variables,
        };
      }
    }

    return {
      pass: false,
      message: () =>
        `Expected to have performed GraphQL operation ${expectedOperationName} but no matching operation was found.`,
    };
  },
});
