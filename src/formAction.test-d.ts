import { expectTypeOf, describe, test } from "vitest";
import { z } from "zod";
import { formAction } from "./formAction";

describe("formAction.input", () => {
  describe("valid calls", () => {
    test("works with z.object()", () => {
      expectTypeOf<typeof formAction.input>().toBeCallableWith(
        z.object({ name: z.string() }),
      );
    });

    test("it supports refinement", () => {
      expectTypeOf<typeof formAction.input>().toBeCallableWith(
        z.object({ name: z.string() }).refine((val) => val),
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
        z.object({ surname: z.string() }).refine((val) => val),
      );
    });

    test("Extending schema with effect is not possible", () => {
      const withEffect = formAction.input(
        z.object({ name: z.string() }).refine((val) => val),
      );

      // Extending schema with effect is not possible.
      // withEffect.input(z.object({ name: z.string() }));

      // @ts-expect-error
      expectTypeOf<typeof withEffect>().not.toBeCallableWith(
        z.object({ name: z.string() }),
      );
    });
  });

  describe("result types", () => {
    const handled = formAction.error(() => {
      return { code: "red" } as const;
    });

    test("without validation", () => {
      const noInputAction = handled.run(async () => {});

      expectTypeOf<typeof noInputAction>().returns.resolves.toMatchTypeOf<
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
            validationError: z.inferFormattedError<typeof schema>;
          }
      >();
    });
  });
});
