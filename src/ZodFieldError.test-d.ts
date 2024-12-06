import { expectTypeOf, describe, test } from "vitest";
import { ZodFormattedError, z } from "zod";
import { formAction } from "./formAction";

import { InferZodErrorPaths } from "./ZodFieldError";

describe("InferZodErrorPaths", () => {
  test("works", () => {
    const schema = z.object({
      name: z.string(),
      deep: z.object({
        param: z.number(),
      }),
    });

    type Expected = InferZodErrorPaths<z.inferFormattedError<typeof schema>>;

    expectTypeOf<Expected>().toMatchTypeOf<"name" | "deep.param">();
  });
});
