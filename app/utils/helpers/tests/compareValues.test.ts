import {describe, expect, it} from 'vitest';
import {compareValues} from '../compareValues';

describe('compareValues', () => {
  describe('with empty values', () => {
    it('returns true for any null-like', () => {
      expect(compareValues(null, null)).toBe(true);
      expect(compareValues(undefined, undefined)).toBe(true);
      expect(compareValues(null, undefined)).toBe(true);
      expect(compareValues(undefined, null)).toBe(true);
    });

    it('returns false for any null-like and a value', () => {
      expect(compareValues(null, 1)).toBe(false);
      expect(compareValues(undefined, 1)).toBe(false);
      expect(compareValues(1, null)).toBe(false);
      expect(compareValues(1, undefined)).toBe(false);
    });
  });

  describe('with scalar values', () => {
    it('returns true for equal values', () => {
      expect(compareValues(1, 1)).toBe(true);
      expect(compareValues('1', '1')).toBe(true);
      expect(compareValues(true, true)).toBe(true);
    });

    it('returns false for unequal values', () => {
      expect(compareValues(1, 2)).toBe(false);
      expect(compareValues('1', '2')).toBe(false);
      expect(compareValues(true, false)).toBe(false);
    });

    it('returns true for equal values with different types', () => {
      expect(compareValues(1, '1')).toBe(true);
      expect(compareValues('1', 1)).toBe(true);
    });
  });

  describe('with object values', () => {
    it('returns true for equal objects', () => {
      expect(compareValues({a: 1}, {a: 1})).toBe(true);
    });

    it('returns true for equal objects with different types', () => {
      expect(compareValues({a: 1}, {a: '1'})).toBe(true);
    });

    it('returns false for unequal objects', () => {
      expect(compareValues({a: 1}, {a: 2})).toBe(false);
    });

    it('returns false for equal objects with different keys', () => {
      expect(compareValues({a: 1}, {b: 1})).toBe(false);
    });

    it('returns false for unequal objects with different keys and values', () => {
      expect(compareValues({a: 1}, {b: 2})).toBe(false);
    });
  });

  describe('with array values', () => {
    it('returns true for equal arrays', () => {
      expect(compareValues([1], [1])).toBe(true);
    });

    it('returns true for equal arrays with different types', () => {
      expect(compareValues([1], ['1'])).toBe(true);
    });

    it('returns false for unequal arrays', () => {
      expect(compareValues([1], [2])).toBe(false);
    });

    it('returns false for arrays with different lengths', () => {
      expect(compareValues([1], [1, 2])).toBe(false);
    });
  });

  describe('with nested objects', () => {
    it('returns true for equal nested objects', () => {
      expect(compareValues({a: {b: 1}}, {a: {b: 1}})).toBe(true);
    });

    it('returns false for unequal nested objects', () => {
      expect(compareValues({a: {b: 1}}, {a: {b: 2}})).toBe(false);
    });

    it('returns false for unequal nested objects with different keys', () => {
      expect(compareValues({a: {b: 1}}, {a: {c: 1}})).toBe(false);
    });

    it('returns true for equal arrays of objects', () => {
      expect(compareValues([{a: 1}], [{a: 1}])).toBe(true);
    });

    it('returns false for unequal arrays of objects', () => {
      expect(compareValues([{a: 1}], [{a: 2}])).toBe(false);
    });

    it('returns false for arrays of objects with different lengths', () => {
      expect(compareValues([{a: 1}], [{a: 1}, {a: 2}])).toBe(false);
    });
  });
});
