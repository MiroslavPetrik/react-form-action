import { expectTypeOf, describe, test } from "vitest";
import { z } from "zod/v4";
import type { $ZodErrorTree } from "zod/v4/core";

import { InferZodErrorPaths } from "./ZodFieldError";

describe("InferZodErrorPaths", () => {
  test("works", () => {
    const schema = z.object({
      name: z.string(),
      deep: z.object({
        param: z.number(),
        p2: z.number(),
      }),
    });

    type ErrorTree = $ZodErrorTree<z.infer<typeof schema>>;

    type Expected = InferZodErrorPaths<ErrorTree>;

    expectTypeOf<Expected>().toMatchTypeOf<"name" | "deep.param" | "deep.p2">();
  });
});
