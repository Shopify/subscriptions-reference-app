import {describe, expect, it} from 'vitest';
import {convertPascalToSnakeCase} from '../string';

describe('convertPascalToSnakeCase', () => {
  it('returns a snake case string', () => {
    const result = convertPascalToSnakeCase('AnExampleString');
    expect(result).toEqual('an_example_string');
  });
});
