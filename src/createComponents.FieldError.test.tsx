import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { Action } from "./Action";
import { createComponents } from "./createComponents";
import { Form } from "./Form";
import { formAction } from "./formAction";

describe("FieldError", () => {
  const action = formAction
    .input(z.object({ email: z.email() }))
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
              <input name="email" />
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
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  describe("when children is a custom render prop", () => {
    test("it always render children", async () => {
      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <input name="email" id="email" />
              <button type="submit" data-testid="submit" />
              <FieldError name="email">
                {({ name, error }) => (
                  <label htmlFor="email" className={error ? "error" : "info"}>
                    {name}
                  </label>
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

  describe("with prop reducers", () => {
    test("the render prop receives the props from the reducers", async () => {
      const action = formAction
        .input(z.object({ email: z.email() }))
        .run(async () => {
          return "success";
        });

      const { FieldError } = createComponents(action, {
        fieldProps: {
          color: (state) => (state.isInvalid ? "red" : "info"),
        },
      });

      function Test() {
        return (
          <Action action={action} initialData="">
            <Form>
              <input name="email" id="email" />
              <button type="submit" data-testid="submit" />
              <FieldError name="email">
                {({ name, color }) => (
                  <label htmlFor="email" className={color}>
                    {name}
                  </label>
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

      expect(label).toHaveClass("red");
    });
  });
});
