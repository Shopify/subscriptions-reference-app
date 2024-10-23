import {MetafieldType, type MetaobjectField} from './MetaobjectField';

export type MetaobjectFieldSchema = {
  key: string;
  type: string;
}[];

export default class Metaobject {
  public id: string;
  private fieldsMap: Map<string, MetaobjectField>;

  constructor({id, fields}: {id: string; fields: MetaobjectField[]}) {
    this.id = id;
    this.fieldsMap = new Map(fields.map((field) => [field.key, field]));
  }

  public get fields(): MetaobjectField[] {
    return Array.from(this.fieldsMap.values());
  }

  public hasField(key: string): boolean {
    return this.fieldsMap.has(key);
  }

  public getField(key: string): MetaobjectField {
    const field = this.fieldsMap.get(key);
    if (!field) {
      throw new Error(`Field '${key}' not found`);
    }
    return field;
  }

  public getFieldType(key: string): MetafieldType {
    const field = this.getField(key);
    return field?.valueType;
  }

  public validateFields(fieldSchema: MetaobjectFieldSchema): boolean {
    return fieldSchema.every(({key, type}) => {
      const field = this.fieldsMap.get(key);
      return field?.valueType === type;
    });
  }

  public getBooleanFieldValue(key: string): boolean {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.BOOLEAN) {
      throw new Error(
        `Expected a boolean field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }

  public getDateTimeFieldValue(key: string): Date {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.DATE_TIME) {
      throw new Error(
        `Expected a date time field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }

  public getJsonFieldValue<T = any>(key: string): T {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.JSON) {
      throw new Error(
        `Expected a JSON field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }

  public getNumberDecimalFieldValue(key: string): number {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.NUMBER_DECIMAL) {
      throw new Error(
        `Expected a decimal number field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }

  public getNumberIntegerFieldValue(key: string): number {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.NUMBER_INTEGER) {
      throw new Error(
        `Expected an integer number field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }

  public getSingleLineTextFieldValue(key: string): string {
    const field = this.getField(key);
    if (field.valueType !== MetafieldType.SINGLE_LINE_TEXT_FIELD) {
      throw new Error(
        `Expected a single line text field for key '${key}', but got ${field.valueType}`,
      );
    }
    return field.value;
  }
}
