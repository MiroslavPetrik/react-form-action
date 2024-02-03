import { it, describe, vi, expect } from "vitest";
import { zfd } from "zod-form-data";
import { formAction } from "./formAction";
import { initial } from "./Form";

describe("formAction", () => {
  it("works", async () => {
    const result = await formAction().run(async () => 42)(
      // @ts-expect-error undefined is ok, we don't use initial state
      undefined,
      undefined
    );

    expect(result).toHaveProperty("type", "success");
    expect(result).toHaveProperty("data", 42);
    expect(result).toHaveProperty("error", null);
  });

  it("rethrows unhandled error", async () => {
    const action = formAction().run<null>(async () => {
      throw new Error();
    });

    await expect(() =>
      action(initial(null), new FormData())
    ).rejects.toThrowError();
  });

  it("return failure type when .error() is used", async () => {
    const withErrorHandler = formAction().error((err) => {
      if (err instanceof Error) {
        return err.message;
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
      throw 2;
    });
    const failedWithNumber = await throwsNumber(initial(null), new FormData());
    expect(failedWithNumber).toHaveProperty("type", "failure");
    expect(failedWithNumber).toHaveProperty("error", "unknown");
  });

  describe("context", () => {
    it("has the original formData by default", async () => {
      const handler = vi.fn(async () => {});

      const formData = new FormData();
      await formAction().run(handler)(
        // @ts-expect-error undefined is ok, we don't use initial state
        undefined,
        formData
      );

      expect(handler).toBeCalledWith({ ctx: { formData } });
    });

    describe("extending context with .use(middleware)", () => {
      it("aggregates the properties", async () => {
        const contextual = formAction()
          .use(async () => ({ a: 1 }))
          .use(async ({ ctx }) => ({ b: "g", c: ctx.a * 3 }));

        const handler = vi.fn(async () => {});

        // @ts-expect-error undefined is ok
        await contextual.run(handler)(undefined, undefined);

        expect(handler).toBeCalledWith({ ctx: { a: 1, b: "g", c: 3 } });
      });
    });
  });

  describe("with schema", () => {
    const action = formAction(
      zfd.formData({
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
          allright: "Invalid input",
        });
      });
    });
  });
});
