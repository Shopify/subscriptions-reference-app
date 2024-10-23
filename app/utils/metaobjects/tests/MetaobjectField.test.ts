import {describe, expect, it} from 'vitest';

import {
  MetafieldType,
  isBooleanField,
  isDateTimeField,
  isJsonField,
  isNumberDecimalField,
  isNumberIntegerField,
  isSingleLineTextField,
  mapAdminResponseToMetaobjectField,
  mapMetaobjectFieldToAdminInput,
  type BooleanMetaobjectField,
  type DateTimeMetaobjectField,
  type JsonMetaobjectField,
  type MetaobjectField,
  type NumberDecimalMetaobjectField,
  type NumberIntegerMetaobjectField,
  type SingleLineTextFieldMetaobjectField,
} from '../MetaobjectField';

import type {MetaobjectField as AdminMetaobjectField} from 'types/admin.types';

describe('MetaobjectField mapping functions', () => {
  describe('mapMetaobjectFieldToAdminInput', () => {
    it('maps a single line text field to an admin input', () => {
      const field: SingleLineTextFieldMetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'foo',
        value: 'Text Value',
      });
    });

    it('maps a boolean field to an admin input', () => {
      const field: BooleanMetaobjectField = {
        key: 'bar',
        value: true,
        valueType: MetafieldType.BOOLEAN,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'bar',
        value: 'true',
      });
    });

    it('maps a JSON field to an admin input', () => {
      const field: JsonMetaobjectField = {
        key: 'baz',
        value: {qux: 'quux'},
        valueType: MetafieldType.JSON,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'baz',
        value: '{"qux":"quux"}',
      });
    });

    it('maps a number decimal field to an admin input', () => {
      const field: NumberDecimalMetaobjectField = {
        key: 'quuz',
        value: 1.23,
        valueType: MetafieldType.NUMBER_DECIMAL,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'quuz',
        value: '1.23',
      });
    });

    it('maps a number integer field to an admin input', () => {
      const field: NumberIntegerMetaobjectField = {
        key: 'corge',
        value: 123,
        valueType: MetafieldType.NUMBER_INTEGER,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'corge',
        value: '123',
      });
    });

    it('maps a date time field to an admin input', () => {
      const date = new Date('2022-01-01T00:00:00Z');
      const field: DateTimeMetaobjectField = {
        key: 'grault',
        value: date,
        valueType: MetafieldType.DATE_TIME,
      };

      const adminInput = mapMetaobjectFieldToAdminInput(field);

      expect(adminInput).toEqual({
        key: 'grault',
        value: '2022-01-01T00:00:00.000Z',
      });
    });
  });

  describe('mapAdminResponseToMetaobjectField', () => {
    it('throws an error if the value is null', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'foo',
        value: null,
        type: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);
      expect(field).toEqual({
        key: 'foo',
        value: null,
        valueType: MetafieldType.NULL,
      });
    });

    it('throws an error for a field with an unsupported type', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'foo',
        value: 'bar',
        type: 'unsupported_type',
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow(
        'Unsupported field type',
      );
    });

    it('maps an admin field to a single line text field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'foo',
        value: 'Text Value',
        type: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      });
    });

    it('maps an admin field to a single line text field without type coersion', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'foo',
        value: 'true',
        type: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'foo',
        value: 'true',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      });
    });

    it('maps an admin field to a boolean field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'bar',
        value: 'true',
        type: MetafieldType.BOOLEAN,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'bar',
        value: true,
        valueType: MetafieldType.BOOLEAN,
      });
    });

    it('throws an error if the boolean value is not a boolean', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'bar',
        value: 'not a boolean',
        type: MetafieldType.BOOLEAN,
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow(
        `Invalid boolean value for field 'bar'`,
      );
    });

    it('maps an admin field to a JSON field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'baz',
        value: '{"qux":"quux"}',
        type: MetafieldType.JSON,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'baz',
        value: {qux: 'quux'},
        valueType: MetafieldType.JSON,
      });
    });

    it('throws an error if the JSON value is not a valid JSON', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'baz',
        value: 'not a json',
        type: MetafieldType.JSON,
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow();
    });

    it('maps an admin field to a number decimal field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'quuz',
        value: '1.23',
        type: MetafieldType.NUMBER_DECIMAL,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'quuz',
        value: 1.23,
        valueType: MetafieldType.NUMBER_DECIMAL,
      });
    });

    it('throws an error if the decimal number value is not a number', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'quuz',
        value: 'not a number',
        type: MetafieldType.NUMBER_DECIMAL,
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow(
        `Invalid decimal number value for field 'quuz'`,
      );
    });

    it('maps an admin field to a number integer field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'corge',
        value: '123',
        type: MetafieldType.NUMBER_INTEGER,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'corge',
        value: 123,
        valueType: MetafieldType.NUMBER_INTEGER,
      });
    });

    it('throws an error if the integer number value is not a number', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'corge',
        value: 'not a number',
        type: MetafieldType.NUMBER_INTEGER,
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow(
        `Invalid integer number value for field 'corge'`,
      );
    });

    it('maps an admin field to a date time field', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'grault',
        value: '2022-01-01T00:00:00.000Z',
        type: MetafieldType.DATE_TIME,
      };

      const field = mapAdminResponseToMetaobjectField(adminField);

      expect(field).toEqual({
        key: 'grault',
        value: new Date('2022-01-01T00:00:00.000Z'),
        valueType: MetafieldType.DATE_TIME,
      });
    });

    it('throws an error if the date value is not a valid date', () => {
      const adminField: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'> = {
        key: 'grault',
        value: 'not a date',
        type: MetafieldType.DATE_TIME,
      };

      expect(() => mapAdminResponseToMetaobjectField(adminField)).toThrow(
        `Invalid date value for field 'grault'`,
      );
    });
  });

  describe('isBooleanField', () => {
    it('returns true if a field is a boolean field', () => {
      const field: MetaobjectField = {
        key: 'bar',
        value: true,
        valueType: MetafieldType.BOOLEAN,
      };

      expect(isBooleanField(field)).toBe(true);
    });

    it('returns false if a field is not a boolean field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isBooleanField(field)).toBe(false);
    });
  });

  describe('isDateTimeField', () => {
    it('returns true if a field is a date time field', () => {
      const field: MetaobjectField = {
        key: 'grault',
        value: new Date('2022-01-01T00:00:00.000Z'),
        valueType: MetafieldType.DATE_TIME,
      };

      expect(isDateTimeField(field)).toBe(true);
    });

    it('returns false if a field is not a date time field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isDateTimeField(field)).toBe(false);
    });
  });

  describe('isJsonField', () => {
    it('returns true if a field is a JSON field', () => {
      const field: MetaobjectField = {
        key: 'baz',
        value: {qux: 'quux'},
        valueType: MetafieldType.JSON,
      };

      expect(isJsonField(field)).toBe(true);
    });

    it('returns false if a field is not a JSON field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isJsonField(field)).toBe(false);
    });
  });

  describe('isNumberDecimalField', () => {
    it('returns true if a field is a number decimal field', () => {
      const field: MetaobjectField = {
        key: 'quuz',
        value: 1.23,
        valueType: MetafieldType.NUMBER_DECIMAL,
      };

      expect(isNumberDecimalField(field)).toBe(true);
    });

    it('returns false if a field is not a number decimal field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isNumberDecimalField(field)).toBe(false);
    });
  });

  describe('isNumberIntegerField', () => {
    it('returns true if a field is a number integer field', () => {
      const field: MetaobjectField = {
        key: 'corge',
        value: 123,
        valueType: MetafieldType.NUMBER_INTEGER,
      };

      expect(isNumberIntegerField(field)).toBe(true);
    });

    it('returns false if a field is not a number integer field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isNumberIntegerField(field)).toBe(false);
    });
  });

  describe('isSingleLineTextField', () => {
    it('returns true if a field is a single line text field', () => {
      const field: MetaobjectField = {
        key: 'foo',
        value: 'Text Value',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      };

      expect(isSingleLineTextField(field)).toBe(true);
    });

    it('returns false if a field is not a single line text field', () => {
      const field: MetaobjectField = {
        key: 'bar',
        value: true,
        valueType: MetafieldType.BOOLEAN,
      };

      expect(isSingleLineTextField(field)).toBe(false);
    });
  });
});
