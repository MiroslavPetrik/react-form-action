import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";

import { createComponents } from "./createComponents";
import { formAction } from "./formAction";
import { Action } from "./Action";
import { Form } from "./Form";

describe("FieldError", () => {
  const action = formAction
    .input(z.object({ email: z.string().email() }))
    .run(async () => {
      return "success";
    });

  const { FieldError } = createComponents(action);

  describe("with default children", () => {
    test("it renders nothing when not invalid", async () => {
      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <input name="email" data-testid="email" />
              <div data-testid="wrapper">
                <FieldError name="email" />
              </div>
              <button type="submit" data-testid="submit" />
            </Form>
          </Action>
        );
      }

      render(<Test />);

      expect(screen.getByTestId("wrapper")).toBeEmptyDOMElement();

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByTestId("wrapper")).not.toBeEmptyDOMElement();
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });
  });

  describe("when children is a custom render prop", () => {
    test("it always render children", async () => {
      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <input name="email" data-testid="email" />
              <button type="submit" data-testid="submit" />
              <FieldError name="email">
                {({ name, error }) => (
                  <label className={error ? "error" : "info"}>{name}</label>
                )}
              </FieldError>
            </Form>
          </Action>
        );
      }

      render(<Test />);

      const label = screen.getByText("email");
      expect(label).toHaveClass("info");

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(label).toHaveClass("error");
    });
  });
});
