import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { createForm } from "./createForm";
import { formAction } from "./formAction";
import { useFormContext } from "./FormContext";

describe("createForm", () => {
  test("it creates a Form which provides a context", async () => {
    const signUp = formAction
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .run(async () => {
        return null;
      });

    const { Form } = createForm(signUp);

    function ContextConsumer() {
      const state = useFormContext();

      return state.type;
    }

    function SignUpForm() {
      return (
        <Form initialData={null}>
          <ContextConsumer />
        </Form>
      );
    }

    render(<SignUpForm />);

    // @ts-expect-error
    expect(screen.getByText("initial")).toBeInTheDocument();
  });
});
