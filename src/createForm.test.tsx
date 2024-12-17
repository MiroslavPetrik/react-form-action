import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";
import { createForm } from "./createForm";
import { formAction } from "./formAction";

describe("createForm", () => {
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

      const { Form, Pending } = createForm(signUp);

      function SignUpForm() {
        return (
          <Form initialData={null}>
            <input type="text" name="email" data-testid="email" />
            <button type="submit" data-testid="submit" />
            <Pending>
              <p>Please wait...</p>
            </Pending>
          </Form>
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
});
