import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";

import { Action } from "./Action";
import { formAction } from "./formAction";
import { Pending } from "./Pending";
import { Form } from "./Form";

describe("Pending", () => {
  test("it renders children when the action is pending", async () => {
    const signUp = formAction
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .run(async () => {
        await new Promise(() => {
          /* never resolve */
        });
        return null;
      });

    function SignUpForm() {
      return (
        <Action action={signUp} initialData={null}>
          <Form>
            <input type="text" name="email" data-testid="email" />
            <button type="submit" data-testid="submit" />
            <Pending>
              <p>Please wait...</p>
            </Pending>
          </Form>
        </Action>
      );
    }

    render(<SignUpForm />);

    const email = screen.getByTestId("email");
    await act(() => userEvent.type(email, "form@action.com"));

    const submit = screen.getByTestId("submit");
    await act(() => userEvent.click(submit));

    // @ts-expect-error
    expect(screen.getByText("Please wait...")).toBeInTheDocument();
  });
});
