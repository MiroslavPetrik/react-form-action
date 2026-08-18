import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Action } from "./Action";
import { createComponents } from "./createComponents";
import { Form } from "./Form";
import { formAction } from "./formAction";

describe("Failure", () => {
  const action = formAction
    .error(async () => "Oops!")
    .run(async () => {
      throw new Error();
    });

  const { Failure } = createComponents(action);

  describe("when children are ReactNode/JSX", () => {
    test("it renders children when the action failed & handled the error", async () => {
      function Test() {
        return (
          <Action action={action} initialData={undefined as never}>
            <Form>
              <button type="submit" data-testid="submit" />
              <div data-testid="wrapper">
                <Failure>
                  <p>ERR</p>
                </Failure>
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
      expect(screen.getByText("ERR")).toBeInTheDocument();
    });
  });

  describe("when children is a render prop", () => {
    test("it provides the error to the render prop", async () => {
      function Test() {
        return (
          <Action action={action} initialData={undefined as never}>
            <Form>
              <button type="submit" data-testid="submit" />
              <div data-testid="wrapper">
                <Failure>
                  {({ error }) => <p className="error">{error}</p>}
                </Failure>
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
      const error = screen.getByText("Oops!");
      expect(error).toHaveClass("error");
    });
  });
});
