import { it, describe, expect } from "vitest";
import { createFormAction, initial } from "./createFormAction";

describe("createFormAction", () => {
  it("supports bind arguments", async () => {
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
});
