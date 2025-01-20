import { it, describe, vi, expect } from "vitest";
import { z } from "zod";
import { formAction } from "./formAction";
import { initial } from "./createFormAction";
import { zfd } from "zod-form-data";

describe("formAction", () => {
  it("works", async () => {
    const action = formAction.run(async () => 42);

    // @ts-expect-error undefined is ok, we don't use initial state
    const result = await action(undefined, undefined);

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
      const withErrorHandler = formAction.error(async ({ error }) => {
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
        .error(async ({ ctx }) => {
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
      const action = formAction.run(handler);

      const formData = new FormData();
      // @ts-expect-error undefined is ok, we don't use initial state
      await action(undefined, formData);

      expect(handler).toBeCalledWith({ args: [], ctx: { formData } });
    });

    describe("extending context with .use(middleware)", () => {
      it("aggregates the properties", async () => {
        const handler = vi.fn(async () => {});

        const contextual = formAction
          .use(async () => ({ a: 1 }))
          .use(async ({ ctx }) => ({ b: "g", c: ctx.a * 3 }))
          .run(handler);

        // @ts-expect-error undefined is ok
        await contextual(undefined, undefined);

        expect(handler).toBeCalledWith({
          args: [],
          ctx: { a: 1, b: "g", c: 3 },
        });
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
      const nestedObjectInput = action
        .input(
          z.object({
            user: z.object({ name: z.string().min(3) }),
          })
        )
        .run(async ({ input }) => input);

      it("has success type when formData match schema", async () => {
        const formData = new FormData();
        formData.set("allright", "on");
        formData.set("user.name", "Patrick");

        // @ts-expect-error undefined is ok
        const result = await nestedObjectInput(undefined, formData);

        expect(result).toHaveProperty("type", "success");
        expect(result).toHaveProperty("data", {
          allright: true,
          user: { name: "Patrick" },
        });
        expect(result).toHaveProperty("error", null);
        expect(result).toHaveProperty("validationError", null);
      });

      it("has invalid type when formData don't match schema", async () => {
        const formData = new FormData();
        formData.set("allright", "9");
        formData.set("user.name", "Pa");

        // @ts-expect-error undefined is ok
        const result = await nestedObjectInput(undefined, formData);

        expect(result).toHaveProperty("type", "invalid");
        expect(result).toHaveProperty("data", null);
        expect(result).toHaveProperty("error", null);
        expect(result).toHaveProperty("validationError", {
          _errors: [],
          allright: {
            _errors: [
              'Invalid literal value, expected "on"',
              "Invalid literal value, expected undefined",
            ],
          },
          user: {
            _errors: [],
            name: {
              _errors: ["String must contain at least 3 character(s)"],
            },
          },
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

      const action = formAction.input(passwordForm).run(async () => {});

      // @ts-expect-error
      const result = await action(undefined, formData);

      expect(result).toHaveProperty("validationError", {
        _errors: [],
        confirm: { _errors: ["Passwords don't match"] },
      });
      expect(result).toHaveProperty("error", null);
    });
  });

  describe("args parsing", () => {
    it("has empty array as args when .args() not called", async () => {
      const action = formAction.run(async ({ args }) => {
        return args.length;
      });

      // @ts-expect-error undefined is ok
      const result = await action(undefined, undefined);

      expect(result).toHaveProperty("data", 0);
    });

    it("has validationError when the args don't match schema", async () => {
      const action = formAction
        .args([z.string().uuid()])
        .run(async ({ args: [userId] }) => {
          return userId;
        });

      const boundArgsAction = action.bind(null, "not uuid");

      // @ts-expect-error undefined is ok
      const result = await boundArgsAction(undefined, undefined);

      expect(result).toHaveProperty("validationError", {
        0: ["Invalid uuid"],
      });
    });
  });
});
