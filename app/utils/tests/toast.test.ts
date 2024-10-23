import {describe, expect, it} from 'vitest';
import {toast} from '../toast';

const DEFAULTS = {
  isError: false,
};

describe('toast', () => {
  it('should create object with default options', () => {
    const expected = {toast: {...DEFAULTS, message: 'test message'}};

    const actual = toast('test message');

    expect(actual).toEqual(expected);
  });

  it('should support the isError option', () => {
    const expected = {toast: {message: 'test message', isError: true}};

    const actual = toast('test message', {isError: true});

    expect(actual).toEqual(expected);
  });

  it('should support the duration option', () => {
    const expected = {
      toast: {...DEFAULTS, message: 'test message', duration: 1000},
    };

    const actual = toast('test message', {duration: 1000});

    expect(actual).toEqual(expected);
  });
});
