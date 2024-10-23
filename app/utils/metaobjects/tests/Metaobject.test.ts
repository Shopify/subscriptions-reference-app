import {describe, expect, it} from 'vitest';
import Metaobject from '../Metaobject';
import {MetafieldType, type MetaobjectField} from '../MetaobjectField';

describe('Metaobject', () => {
  const id = 'gid://shopify/MetaObject/9';
  const singleLineTextField: MetaobjectField = {
    key: 'foo',
    value: 'Text Value',
    valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
  };
  const booleanField: MetaobjectField = {
    key: 'bar',
    value: true,
    valueType: MetafieldType.BOOLEAN,
  };
  const jsonField: MetaobjectField = {
    key: 'baz',
    value: {qux: 'quux'},
    valueType: MetafieldType.JSON,
  };
  const decimalField: MetaobjectField = {
    key: 'qux',
    value: 3.14,
    valueType: MetafieldType.NUMBER_DECIMAL,
  };
  const integerField: MetaobjectField = {
    key: 'quux',
    value: 42,
    valueType: MetafieldType.NUMBER_INTEGER,
  };
  const dateTimeField: MetaobjectField = {
    key: 'quuz',
    value: new Date(),
    valueType: MetafieldType.DATE_TIME,
  };
  const fields: MetaobjectField[] = [
    singleLineTextField,
    booleanField,
    jsonField,
    decimalField,
    integerField,
    dateTimeField,
  ];

  const metaobject = new Metaobject({id, fields});

  describe('hasField', () => {
    it('returns true if a field with the given key exists', () => {
      const key = fields[0].key;
      expect(metaobject.hasField(key)).toBe(true);
    });

    it('returns false if no field with the given key exists', () => {
      const key = 'invalid-key';
      expect(metaobject.hasField(key)).toBe(false);
    });
  });

  describe('getField', () => {
    it('returns the field with the given key', () => {
      const expectedField = fields[0];

      const field = metaobject.getField(expectedField.key);
      expect(field).toEqual(expectedField);
    });

    it('throws an error if no field with the given key exists', () => {
      const key = 'invalid-key';
      expect(() => metaobject.getField(key)).toThrow(
        `Field 'invalid-key' not found`,
      );
    });
  });

  describe('fields', () => {
    it('returns an array of all fields', () => {
      expect(metaobject.fields).toEqual(fields);
    });
  });

  describe('getFieldType', () => {
    it('returns the type of the field with the given key', () => {
      fields.forEach((field) => {
        expect(metaobject.getFieldType(field.key)).toEqual(field.valueType);
      });
    });

    it('throws undefined if no field with the given key exists', () => {
      expect(() => metaobject.getFieldType('invalid-key')).toThrow(
        `Field 'invalid-key' not found`,
      );
    });
  });

  describe('validateFields', () => {
    it('returns true if all given fields exist and have the correct type', () => {
      const fieldsToValidate = [
        {key: 'foo', type: 'single_line_text_field'},
        {key: 'bar', type: 'boolean'},
      ];

      expect(metaobject.validateFields(fieldsToValidate)).toBe(true);
    });

    it('returns false if a field does not exist', () => {
      const fieldsToValidate = [
        {key: 'foo', type: 'single_line_text_field'},
        {key: 'invalid-key', type: 'boolean'},
      ];

      expect(metaobject.validateFields(fieldsToValidate)).toBe(false);
    });

    it('returns false if a field has the wrong type', () => {
      const fieldsToValidate = [
        {key: 'foo', type: 'single_line_text_field'},
        {key: 'bar', type: 'single_line_text_field'},
      ];

      expect(metaobject.validateFields(fieldsToValidate)).toBe(false);
    });
  });

  describe('getBooleanFieldValue', () => {
    it('returns the boolean value of the field with the given key', () => {
      const expectedField = booleanField;
      expect(metaobject.getBooleanFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if the field is not a boolean field', () => {
      expect(() =>
        metaobject.getBooleanFieldValue(singleLineTextField.key),
      ).toThrow(
        `Expected a boolean field for key 'foo', but got single_line_text_field`,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() => metaobject.getBooleanFieldValue('invalid-key')).toThrow(
        `Field 'invalid-key' not found`,
      );
    });
  });

  describe('getDateTimeFieldValue', () => {
    it('returns the Date value of the field with the given key', () => {
      const expectedField = dateTimeField;
      expect(metaobject.getDateTimeFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if the field is not a Date field', () => {
      expect(() =>
        metaobject.getDateTimeFieldValue(singleLineTextField.key),
      ).toThrow(
        `Expected a date time field for key 'foo', but got single_line_text_field`,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() => metaobject.getDateTimeFieldValue('invalid-key')).toThrow(
        `Field 'invalid-key' not found`,
      );
    });
  });

  describe('getJsonFieldValue', () => {
    it('returns the JSON value of the field with the given key', () => {
      const expectedField = jsonField;
      expect(metaobject.getJsonFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if the field is not a JSON field', () => {
      expect(() =>
        metaobject.getJsonFieldValue(singleLineTextField.key),
      ).toThrow(
        `Expected a JSON field for key 'foo', but got single_line_text_field`,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() => metaobject.getJsonFieldValue('invalid-key')).toThrow(
        `Field 'invalid-key' not found`,
      );
    });
  });

  describe('getNumberDecimalFieldValue', () => {
    it('returns the decimal number value of the field with the given key', () => {
      const expectedField = decimalField;
      expect(metaobject.getNumberDecimalFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if the field is not a decimal number field', () => {
      expect(() =>
        metaobject.getNumberDecimalFieldValue(singleLineTextField.key),
      ).toThrow(
        `Expected a decimal number field for key 'foo', but got single_line_text_field`,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() =>
        metaobject.getNumberDecimalFieldValue('invalid-key'),
      ).toThrow(`Field 'invalid-key' not found`);
    });
  });

  describe('getNumberIntegerFieldValue', () => {
    it('returns the integer number value of the field with the given key', () => {
      const expectedField = integerField;
      expect(metaobject.getNumberIntegerFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if the field is not an integer number field', () => {
      expect(() =>
        metaobject.getNumberIntegerFieldValue(singleLineTextField.key),
      ).toThrow(
        `Expected an integer number field for key 'foo', but got single_line_text_field`,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() =>
        metaobject.getNumberIntegerFieldValue('invalid-key'),
      ).toThrow(`Field 'invalid-key' not found`);
    });
  });

  describe('getSingleLineTextFieldValue', () => {
    it('returns the text value of the field with the given key', () => {
      const expectedField = singleLineTextField;
      expect(metaobject.getSingleLineTextFieldValue(expectedField.key)).toBe(
        expectedField.value,
      );
    });

    it('throws an error if no field with the given key exists', () => {
      expect(() =>
        metaobject.getSingleLineTextFieldValue('invalid-key'),
      ).toThrow(`Field 'invalid-key' not found`);
    });

    it('throws an error if the field is not a single line text field', () => {
      expect(() =>
        metaobject.getSingleLineTextFieldValue(booleanField.key),
      ).toThrow(
        `Expected a single line text field for key 'bar', but got boolean`,
      );
    });
  });
});
