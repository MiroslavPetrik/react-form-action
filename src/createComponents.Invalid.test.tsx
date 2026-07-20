import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod/v4";

import { createComponents } from "./createComponents";
import { formAction } from "./formAction";
import { Action } from "./Action";
import { Form } from "./Form";

describe("<Invalid />", () => {
  describe("with args action", () => {
    const action = formAction.args([z.string()]).run(async ({ args }) => {
      return args[0];
    });

    const { Invalid } = createComponents(action);

    test("it can access arg validation error", async () => {
      function Test() {
        // @ts-expect-error number is not a valid string
        const failAction = action.bind(null, 10);

        return (
          <Action action={failAction} initialData="">
            <Form>
              <button type="submit" data-testid="submit" />
              <Invalid>
                {({ validationError }) => (
                  <p>{validationError?.items?.[0]?.errors ?? "no error"}</p>
                )}
              </Invalid>
            </Form>
          </Action>
        );
      }

      render(<Test />);
      const label = screen.getByText("no error");

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(label).toHaveTextContent(
        "Invalid input: expected string, received number",
      );
    });
  });
});
