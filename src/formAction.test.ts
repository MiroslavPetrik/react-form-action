import { it, describe, vi, expect } from "vitest";
import {
  AnyZodObject,
  ZodEffects,
  ZodObject,
  ZodType,
  ZodTypeAny,
  z,
} from "zod";
import { formAction } from "./formAction";
import { initial } from "./Form";
import { zfd } from "zod-form-data";

describe("formAction", () => {
  it("works", async () => {
    const result = await formAction.run(async () => 42)(
      // @ts-expect-error undefined is ok, we don't use initial state
      undefined,
      undefined
    );

    expect(result).toHaveProperty("type", "success");
    expect(result).toHaveProperty("data", 42);
    expect(result).toHaveProperty("error", null);
  });

  it("rethrows unhandled error", async () => {
    const action = formAction.run<null>(async () => {
      throw new Error();
    });

    await expect(() =>
      action(initial(null), new FormData())
    ).rejects.toThrowError();
  });

  describe("error handling with .error()", () => {
    it("returns failure type", async () => {
      const withErrorHandler = formAction.error(({ error }) => {
        if (error instanceof Error) {
          return error.message;
        } else {
          return "unknown";
        }
      });

      const throwsError = withErrorHandler.run<null>(async () => {
        throw new Error("whopsie");
      });

      const failedWithError = await throwsError(initial(null), new FormData());

      expect(failedWithError).toHaveProperty("type", "failure");
      expect(failedWithError).toHaveProperty("error", "whopsie");

      const throwsNumber = withErrorHandler.run<null>(async () => {
        throw 42;
      });
      const failedWithNumber = await throwsNumber(
        initial(null),
        new FormData()
      );
      expect(failedWithNumber).toHaveProperty("type", "failure");
      expect(failedWithNumber).toHaveProperty("error", "unknown");
    });

    it("has access to context", async () => {
      const protectedAction = formAction
        .use(async () => {
          const authorized = false;

          return { authorized };
        })
        .error(({ ctx }) => {
          if (!ctx.authorized) {
            return "unauthorized";
          } else {
            return "unknown";
          }
        });

      const throws = protectedAction.run<null>(async () => {
        throw new Error();
      });

      const failedUnauthorized = await throws(initial(null), new FormData());

      expect(failedUnauthorized).toHaveProperty("type", "failure");
      expect(failedUnauthorized).toHaveProperty("error", "unauthorized");
    });
  });

  describe("context", () => {
    it("has the original formData by default", async () => {
      const handler = vi.fn(async () => {});

      const formData = new FormData();
      await formAction.run(handler)(
        // @ts-expect-error undefined is ok, we don't use initial state
        undefined,
        formData
      );

      expect(handler).toBeCalledWith({ ctx: { formData } });
    });

    describe("extending context with .use(middleware)", () => {
      it("aggregates the properties", async () => {
        const contextual = formAction
          .use(async () => ({ a: 1 }))
          .use(async ({ ctx }) => ({ b: "g", c: ctx.a * 3 }));

        const handler = vi.fn(async () => {});

        // @ts-expect-error undefined is ok
        await contextual.run(handler)(undefined, undefined);

        expect(handler).toBeCalledWith({ ctx: { a: 1, b: "g", c: 3 } });
      });
    });
  });

  describe("with input", () => {
    const action = formAction.input(
      z.object({
        allright: zfd.checkbox(),
      })
    );

    describe("formData parsing", () => {
      const feeling = action.run(async ({ input: { allright } }) =>
        allright ? "OK" : "KO"
      );

      it("has success type when formData match schema", async () => {
        const formData = new FormData();
        formData.set("allright", "on");

        const result = await feeling(
          // @ts-expect-error undefined is ok
          undefined,
          formData
        );

        expect(result).toHaveProperty("type", "success");
        expect(result).toHaveProperty("data", "OK");
        expect(result).toHaveProperty("error", null);
        expect(result).toHaveProperty("validationError", null);
      });

      it("has invalid type when formData don't match schema", async () => {
        const formData = new FormData();
        formData.set("allright", "9");

        const result = await feeling(
          // @ts-expect-error undefined is ok
          undefined,
          formData
        );

        expect(result).toHaveProperty("type", "invalid");
        expect(result).toHaveProperty("data", null);
        expect(result).toHaveProperty("error", null);
        expect(result).toHaveProperty("validationError", {
          fieldErrors: {
            allright: ["Invalid input"],
          },
          formErrors: [],
        });
      });
    });

    it("it aggregates input", async () => {
      const foo = action.input(z.object({ age: zfd.numeric() }));

      const formData = new FormData();
      formData.set("allright", "on");
      formData.set("age", "42");

      const result = await foo.run(
        async ({ input: { age, allright } }) =>
          `You are ${age} y.o. and feeling ${allright ? "ok" : "ko"}`
      )(
        // @ts-expect-error undefined is ok
        undefined,
        formData
      );

      expect(result).toHaveProperty("type", "success");
      expect(result).toHaveProperty("data", "You are 42 y.o. and feeling ok");
      expect(result).toHaveProperty("error", null);
      expect(result).toHaveProperty("validationError", null);
    });

    it("works with refinement", async () => {
      const passwordForm = z
        .object({
          password: z.string(),
          confirm: z.string(),
        })
        .refine((data) => data.password === data.confirm, {
          message: "Passwords don't match",
          path: ["confirm"],
        });

      const formData = new FormData();
      formData.set("password", "nbusr123");
      formData.set("confirm", "deusvult");

      const result = await formAction
        .input(passwordForm)
        .run(async ({ input }) => {})(
        // @ts-expect-error
        undefined,
        formData
      );

      expect(result).toHaveProperty("validationError", {
        fieldErrors: {
          confirm: ["Passwords don't match"],
        },
        formErrors: [],
      });
      expect(result).toHaveProperty("error", null);
    });
  });
});
