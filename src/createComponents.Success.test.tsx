import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";

import { createComponents } from "./createComponents";
import { formAction } from "./formAction";
import { Action } from "./Action";
import { Form } from "./Form";

describe("Success", () => {
  // TODO: drop input https://github.com/MiroslavPetrik/react-form-action/issues/12
  const action = formAction.input(z.object({})).run(async () => {
    return "success";
  });

  const { Success } = createComponents(action);

  describe("when children are ReactNode/JSX", () => {
    test("it renders children when the action is pending", async () => {
      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <button type="submit" data-testid="submit" />
              <div data-testid="wrapper">
                <Success>
                  <p>OK</p>
                </Success>
              </div>
            </Form>
          </Action>
        );
      }

      render(<Test />);

      expect(screen.getByTestId("wrapper")).toBeEmptyDOMElement();

      const submit = screen.getByTestId("submit");
      await act(() => userEvent.click(submit));

      expect(screen.getByTestId("wrapper")).not.toBeEmptyDOMElement();
      expect(screen.getByText("OK")).toBeInTheDocument();
    });
  });

  describe("when children is a render prop", () => {
    test("it always render children", async () => {
      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <button type="submit" data-testid="submit" />
              <Success>
                {({ isSuccess, data }) => (
                  <label className={isSuccess ? data : "info"}>Color</label>
                )}
              </Success>
            </Form>
          </Action>
        );
      }

      render(<Test />);

      const label = screen.getByText("Color");
      expect(label).toHaveClass("info");

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(label).toHaveClass("success");
    });
  });
});
