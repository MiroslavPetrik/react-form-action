import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";

import { Action } from "./Action";
import { formAction } from "./formAction";
import { Pending } from "./Pending";
import { Form } from "./Form";

describe("Pending", () => {
  const neverResolve = formAction.run(async () => {
    await new Promise(() => {
      /* never resolve */
    });
    return null;
  });

  describe("when children are ReactNode/JSX", () => {
    test("it renders children when the action is pending", async () => {
      function Test() {
        return (
          <Action action={neverResolve} initialData={null}>
            <Form>
              <button type="submit" data-testid="submit" />
              <div data-testid="wrapper">
                <Pending>
                  <p>Please wait...</p>
                </Pending>
              </div>
            </Form>
          </Action>
        );
      }

      render(<Test />);

      // @ts-expect-error
      expect(screen.getByTestId("wrapper")).toBeEmptyDOMElement();

      const submit = screen.getByTestId("submit");
      await act(() => userEvent.click(submit));

      // @ts-expect-error
      expect(screen.getByTestId("wrapper")).not.toBeEmptyDOMElement();

      // @ts-expect-error
      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });
  });

  describe("when children is a render prop", () => {
    test("it always render children", async () => {
      function Test() {
        return (
          <Action action={neverResolve} initialData={null}>
            <Form>
              <Pending>
                {({ isPending }) => (
                  <button
                    type="submit"
                    data-testid="submit"
                    disabled={isPending}
                  />
                )}
              </Pending>
            </Form>
          </Action>
        );
      }

      render(<Test />);

      const submit = screen.getByTestId("submit");

      // @ts-expect-error
      expect(submit).toBeInTheDocument();
      // @ts-expect-error
      expect(submit).not.toBeDisabled();

      await act(() => userEvent.click(submit));

      // @ts-expect-error
      expect(submit).toBeDisabled();
    });
  });
});
