import type {ObjectValues} from 'config/types';

import type {
  MetaobjectField as AdminMetaobjectField,
  MetaobjectFieldInput as AdminMetaobjectFieldInput,
} from 'types/admin.types';

export const MetafieldType = {
  BOOLEAN: 'boolean',
  DATE_TIME: 'date_time',
  JSON: 'json',
  NUMBER_DECIMAL: 'number_decimal',
  NUMBER_INTEGER: 'number_integer',
  SINGLE_LINE_TEXT_FIELD: 'single_line_text_field',
  NULL: 'null',
} as const;
export type MetafieldType = ObjectValues<typeof MetafieldType>;

interface MetaobjectFieldBase {
  valueType: MetafieldType;
  key: string;
}

export interface BooleanMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.BOOLEAN;
  value: boolean;
}

export interface DateTimeMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.DATE_TIME;
  value: Date;
}

export interface JsonMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.JSON;
  value: any;
}

export interface NumberDecimalMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.NUMBER_DECIMAL;
  value: number;
}

export interface NumberIntegerMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.NUMBER_INTEGER;
  value: number;
}

export interface SingleLineTextFieldMetaobjectField
  extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.SINGLE_LINE_TEXT_FIELD;
  value: string;
}

export interface NullMetaobjectField extends MetaobjectFieldBase {
  valueType: typeof MetafieldType.NULL;
  value: null;
}

export type MetaobjectField =
  | BooleanMetaobjectField
  | DateTimeMetaobjectField
  | JsonMetaobjectField
  | NumberDecimalMetaobjectField
  | NumberIntegerMetaobjectField
  | SingleLineTextFieldMetaobjectField
  | NullMetaobjectField;

export type NonNullMetaobjectField = Exclude<
  MetaobjectField,
  NullMetaobjectField
>;

export function mapMetaobjectFieldToAdminInput(
  field: MetaobjectField,
): AdminMetaobjectFieldInput {
  let serializedValue: string;

  const {key, valueType, value} = field;

  switch (valueType) {
    case MetafieldType.DATE_TIME:
      serializedValue = value?.toISOString() ?? '';
      break;
    case MetafieldType.JSON:
      serializedValue = JSON.stringify(value);
      break;
    case MetafieldType.BOOLEAN:
    case MetafieldType.NUMBER_DECIMAL:
    case MetafieldType.NUMBER_INTEGER:
      serializedValue = value?.toString() ?? '';
      break;
    case MetafieldType.SINGLE_LINE_TEXT_FIELD:
      serializedValue = value ?? '';
      break;
    case MetafieldType.NULL:
      serializedValue = 'null';
      break;
    default:
      return field satisfies never;
  }

  return {
    key: key,
    value: serializedValue,
  };
}

export function mapAdminResponseToMetaobjectField(
  field: Pick<AdminMetaobjectField, 'key' | 'value' | 'type'>,
): MetaobjectField {
  const {key, type, value} = field;

  if (!value) {
    return {
      key: key,
      valueType: MetafieldType.NULL,
      value: null,
    };
  }

  switch (type) {
    case MetafieldType.DATE_TIME:
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        throw new Error(`Invalid date value for field '${key}'`);
      }
      return {
        key: key,
        valueType: type,
        value: dateValue,
      };
    case MetafieldType.BOOLEAN:
      if (value !== 'true' && value !== 'false') {
        throw new Error(`Invalid boolean value for field '${key}'`);
      }
      const booleanValue = value === 'true';
      return {
        key: key,
        valueType: type,
        value: booleanValue,
      };
    case MetafieldType.JSON:
      let jsonValue;
      try {
        jsonValue = JSON.parse(value);
      } catch (error) {
        throw new Error(`Invalid JSON value for field '${key}'`);
      }
      return {
        key: key,
        valueType: type,
        value: jsonValue,
      };
    case MetafieldType.NUMBER_DECIMAL:
      const decimalValue = parseFloat(value);
      if (isNaN(decimalValue)) {
        throw new Error(`Invalid decimal number value for field '${key}'`);
      }
      return {
        key: key,
        valueType: type,
        value: decimalValue,
      };
    case MetafieldType.NUMBER_INTEGER:
      const numberValue = parseInt(value, 10);
      if (isNaN(numberValue)) {
        throw new Error(`Invalid integer number value for field '${key}'`);
      }
      return {
        key: key,
        valueType: type,
        value: numberValue,
      };
    case MetafieldType.SINGLE_LINE_TEXT_FIELD:
      return {
        key: key,
        valueType: type,
        value: value,
      };
    case MetafieldType.NULL:
      return {
        key: key,
        valueType: type,
        value: null,
      };
    default:
      throw new Error(
        `Unsupported field type '${field.type}' for field '${field.key}'`,
      );
  }
}

export function isBooleanField(
  field: MetaobjectFieldBase,
): field is BooleanMetaobjectField {
  return field.valueType === MetafieldType.BOOLEAN;
}

export function isDateTimeField(
  field: MetaobjectFieldBase,
): field is DateTimeMetaobjectField {
  return field.valueType === MetafieldType.DATE_TIME;
}

export function isJsonField(
  field: MetaobjectFieldBase,
): field is JsonMetaobjectField {
  return field.valueType === MetafieldType.JSON;
}

export function isNumberDecimalField(
  field: MetaobjectFieldBase,
): field is NumberDecimalMetaobjectField {
  return field.valueType === MetafieldType.NUMBER_DECIMAL;
}

export function isNumberIntegerField(
  field: MetaobjectFieldBase,
): field is NumberIntegerMetaobjectField {
  return field.valueType === MetafieldType.NUMBER_INTEGER;
}

export function isSingleLineTextField(
  field: MetaobjectFieldBase,
): field is SingleLineTextFieldMetaobjectField {
  return field.valueType === MetafieldType.SINGLE_LINE_TEXT_FIELD;
}

export function isNullField(
  field: MetaobjectFieldBase,
): field is NullMetaobjectField {
  return field.valueType === MetafieldType.NULL;
}
