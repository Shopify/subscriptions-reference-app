import {describe, expect, it} from 'vitest';
import {formStringToArray} from '../form';

describe('form', () => {
  describe('formStringToArray', () => {
    it('should return an empty array if the string is empty', () => {
      const res = formStringToArray('');
      expect(res).toEqual([]);
    });

    it('should return an array of strings', () => {
      const res = formStringToArray('element one,element two,element three');
      expect(res).toEqual(['element one', 'element two', 'element three']);
    });
  });
});
