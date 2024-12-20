import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";
import { Action, useActionContext } from "./Action";
import { formAction } from "./formAction";
import { ActionForm } from "./ActionForm";

describe("Action", () => {
  test("it enables form to consume action via context", async () => {
    function ValidationError() {
      const { isInvalid } = useActionContext();

      return isInvalid && <p>Invalid email</p>;
    }

    const subscribeAction = formAction
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .run(async () => {
        return null;
      });

    function SubscribeForm() {
      return (
        <Action action={subscribeAction} initialData={null}>
          <ActionForm>
            <input type="text" name="email" data-testid="email" />
            <button type="submit" data-testid="submit" />
          </ActionForm>
          <ValidationError />
        </Action>
      );
    }

    render(<SubscribeForm />);

    await act(() => userEvent.type(screen.getByTestId("email"), "fake"));
    await act(() => userEvent.click(screen.getByTestId("submit")));

    expect(
      screen.getByText("Invalid email")
      // @ts-expect-error
    ).toBeInTheDocument();
  });
});
