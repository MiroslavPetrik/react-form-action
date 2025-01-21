import { expectTypeOf, describe, test } from "vitest";
import { z } from "zod";
import { formAction } from "./formAction";

describe("formAction.input", () => {
  describe("valid calls", () => {
    test("works with z.object()", () => {
      expectTypeOf<typeof formAction.input>().toBeCallableWith(
        z.object({ name: z.string() })
      );
    });

    test("it supports refinement", () => {
      expectTypeOf<typeof formAction.input>().toBeCallableWith(
        z.object({ name: z.string() }).refine((val) => val)
      );
    });
  });

  describe("invalid calls", () => {
    test("The schema output must be an object.", () => {
      // The schema output must be an object.
      // formAction.input(z.string());

      // @ts-expect-error
      expectTypeOf<typeof formAction.input>().not.toBeCallableWith(z.string());
    });

    test("Your input contains effect which prevents merging it with the previous inputs.", () => {
      const basic = formAction.input(z.object({ name: z.string() }));

      // Your input contains effect which prevents merging it with the previous inputs."
      // basic.input(z.object({ surname: z.string() }).refine((val) => val));

      // @ts-expect-error
      expectTypeOf<typeof basic>().not.toBeCallableWith(
        z.object({ surname: z.string() }).refine((val) => val)
      );
    });

    test("Extending schema with effect is not possible", () => {
      const withEffect = formAction.input(
        z.object({ name: z.string() }).refine((val) => val)
      );

      // Extending schema with effect is not possible.
      // withEffect.input(z.object({ name: z.string() }));

      // @ts-expect-error
      expectTypeOf<typeof withEffect>().not.toBeCallableWith(
        z.object({ name: z.string() })
      );
    });
  });

  describe("result types", () => {
    const handled = formAction.error(async () => {
      return { code: "red" } as const;
    });

    const noArgs = z.tuple([]);

    test("without validation", () => {
      const noInputAction = handled.run(async () => {});

      expectTypeOf<typeof noInputAction>().returns.resolves.toMatchTypeOf<
        | {
            type: "initial";
            data: null;
            error: null;
            validationError: null;
          }
        | {
            type: "invalid";
            data: null;
            error: null;
            validationError: z.inferFormattedError<typeof noArgs>;
          }
        | {
            type: "failure";
            data: null;
            error: {
              code: "red";
            };
            validationError: null;
          }
        | {
            type: "success";
            data: void;
            error: null;
            validationError: null;
          }
      >();
    });

    describe("with schema validation", () => {
      const schema = z.object({ name: z.string() });
      const inputAction = handled.input(schema);

      const action = inputAction.run(async () => {});

      expectTypeOf<typeof action>().returns.resolves.toMatchTypeOf<
        | {
            type: "initial";
            data: null;
            error: null;
            validationError: null;
          }
        | {
            type: "failure";
            data: null;
            error: {
              code: "red";
            };
            validationError: null;
          }
        | {
            type: "success";
            data: void;
            error: null;
            validationError: null;
          }
        | {
            type: "invalid";
            data: null;
            error: null;
            validationError:
              | z.inferFormattedError<typeof schema>
              | z.inferFormattedError<typeof noArgs>;
          }
      >();
    });
  });
});

describe("formAction.use", () => {
  test("it accumulates the context properties with each .use() call", () => {
    const a = formAction.use(async () => ({ a: "1" }));
    const b = a.use(async () => ({ b: "2" }));

    expectTypeOf<typeof b.run>().parameter(0).toMatchTypeOf<
      (params: {
        args: [];
        ctx: { a: "1"; b: "2"; formData: FormData };
      }) => Promise<unknown>
    >;
  });
});

describe("formAction.args", () => {
  test("it has index based validationError", async () => {
    const a = formAction
      .args([z.number(), z.string()])
      .run(async ({ args }) => args);

    // @ts-expect-error swapped types
    const bound = a.bind(null, "1", 2);

    // @ts-expect-error ok
    const { validationError, type } = await bound(undefined, undefined);

    if (type === "invalid") {
      expectTypeOf<typeof validationError>().toMatchTypeOf<{
        _errors: string[];
        0?: { _errors: string[] };
        1?: { _errors: string[] };
        9?: { _errors: string[] }; // any index works hmm
      }>;
    }
  });
});
