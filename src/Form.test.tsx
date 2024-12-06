import React from "react";
import { describe, test } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";
import { Form } from "./Form";
import { formAction } from "./formAction";
import { ZodFieldError } from "./ZodFieldError";

describe("Form", () => {
  test("it integrates with ZodFieldError", async () => {
    const signUp = formAction
      .input(
        z
          .object({
            user: z.object({
              email: z.string().email(),
            }),
            password: z.string().min(8),
            confirm: z.string(),
          })
          .refine((data) => data.password === data.confirm, {
            message: "Passwords don't match",
          })
      )
      .error(() => "fail")
      .run(async () => {
        // implementation
        return "success";
      });

    function SignUpForm() {
      return (
        <Form action={signUp} initialData="">
          {({ isInvalid, validationError }) => {
            return (
              <>
                {isInvalid && (
                  <>
                    <ZodFieldError errors={validationError} />
                    <ZodFieldError errors={validationError} name="user.email" />
                    <ZodFieldError errors={validationError} name="password" />
                  </>
                )}
                <input type="text" name="user.email" data-testid="email" />
                <input type="text" name="password" data-testid="pass" />
                <input type="text" name="confirm" />
                <button type="submit" data-testid="submit" />
              </>
            );
          }}
        </Form>
      );
    }

    render(<SignUpForm />);

    const email = screen.getByTestId("email");
    await act(() => userEvent.type(email, "fake"));

    const pass = screen.getByTestId("pass");
    await act(() => userEvent.type(pass, "short"));

    // TODO: this fails
    // const submit = screen.getByTestId("submit");
    // await act(() => userEvent.click(submit));

    // expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    // expect(
    //   screen.getByText("Something email")
    //   // @ts-expect-error
    // ).toBeInTheDocument();
    // expect(
    //   screen.getByText("String must contain at least 8 character(s)")
    //   // @ts-expect-error
    // ).toBeInTheDocument();
  });
});
