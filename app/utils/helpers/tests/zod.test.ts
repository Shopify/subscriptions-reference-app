import {describe, expect, it} from 'vitest';
import {gidArray, gidArrayString} from '../zod';

describe('zod', () => {
  describe('gidArray', () => {
    it('successfully parses an array of gids of a given type', async () => {
      const mockGidArray = [
        'gid://shopify/Product/123',
        'gid://shopify/Product/456',
      ];
      const res = gidArray('Product', '').parse(mockGidArray);

      expect(res).toStrictEqual(mockGidArray);
    });

    it('throws an error when given gids of the wrong type', async () => {
      const mockGidArray = [
        'gid://shopify/Customer/456',
        'gid://shopify/Customer/456',
      ];

      expect(() => gidArray('Product', '').parse(mockGidArray)).toThrowError();
    });

    it('throws an error when given non-gid values', async () => {
      const mockGidArray = ['hello', 'world'];

      expect(() => gidArray('Product', '').parse(mockGidArray)).toThrowError();
    });
  });

  describe('gidArrayString', () => {
    it('successfully parses a string representing a list of gids of a given type', async () => {
      const mockGidArrayString =
        'gid://shopify/Product/123,gid://shopify/Product/456';
      const res = gidArrayString('Product', '').parse(mockGidArrayString);

      expect(res).toStrictEqual(mockGidArrayString);
    });

    it('allows the empty string when allowEmpty is true', async () => {
      const mockGidArrayString = '';
      const res = gidArrayString('Product', '', true).parse(mockGidArrayString);

      expect(res).toStrictEqual(mockGidArrayString);
    });

    it('does not allow the empty string when allowEmpty is false', async () => {
      const mockGidArrayString = '';

      expect(() =>
        gidArrayString('Product', '', false).parse(mockGidArrayString),
      ).toThrowError();
    });

    it('throws an error when given a gid of the wrong type', async () => {
      const mockGidArrayString =
        'gid://shopify/Order/123,gid://shopify/Order/456';

      expect(() =>
        gidArrayString('Product', '').parse(mockGidArrayString),
      ).toThrowError();
    });

    it('throws an error when given a gid of the wrong type', async () => {
      const mockGidArrayString = expect(() =>
        gidArrayString('Product', '').parse(mockGidArrayString),
      ).toThrowError();
    });
  });
});
