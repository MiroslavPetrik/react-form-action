import { type ZodObject, z } from "zod";
import { zfd } from "zod-form-data";

/**
 * A helper to make a validate function for the client validation with <Action validate={} /> prop.
 * @param schema z.object(...) schema
 * @returns validate function
 */
export function validateSchema<T extends ZodObject>(schema: T) {
  return (formData: FormData) => {
    const result = zfd.formData(schema).safeParse(formData);

    if (result.error) {
      return z.treeifyError(result.error);
    }

    return null;
  };
}
