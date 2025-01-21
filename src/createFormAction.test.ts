import { it, describe, expect } from "vitest";
import { createFormAction, initial } from "./createFormAction";

describe("createFormAction", () => {
  describe("argument binding", () => {
    it("works with single argument", async () => {
      const action = createFormAction(
        ({ success }, userId: number) =>
          async () =>
            success({ userId })
      );

      const boundAction = action.bind(null, 9);

      expect(await boundAction(initial(undefined), new FormData())).toEqual({
        type: "success",
        data: { userId: 9 },
        error: null,
        validationError: null,
      });
    });

    it("works with multiple arguments", async () => {
      const action = createFormAction(
        ({ success }, ...args: [number, string, boolean]) =>
          async () =>
            success({ args })
      );

      const boundAction = action.bind(null, 9, "hello", true);

      expect(await boundAction(initial(undefined), new FormData())).toEqual({
        type: "success",
        data: { args: [9, "hello", true] },
        error: null,
        validationError: null,
      });
    });
  });
});
