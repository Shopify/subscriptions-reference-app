import {createValidator, type ValidationResult} from '@rvf/core';
import type {ZodType} from 'zod';

type ZodSchemaType<Type> = Type extends ZodType<infer X> ? X : never;

export async function validateFormData<S extends ZodType>(
  schema: S,
  formData: FormData,
): Promise<ValidationResult<ZodSchemaType<S>>> {
  const validator = createValidator<ZodSchemaType<S>>({
    validate: async (data) => {
      const result = await schema.safeParseAsync(data);
      if (result.success) {
        return {data: result.data, error: undefined};
      }
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      return {error: fieldErrors, data: undefined};
    },
  });

  return validator.validate(formData);
}
