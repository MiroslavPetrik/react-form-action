import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";
import { Action } from "./Action";
import { formAction } from "./formAction";
import { ActionForm } from "./ActionForm";

import { createComponents } from "./createComponents";

describe("Action", () => {
  test("it enables form to consume action via context", async () => {
    const subscribeAction = formAction
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .run(async () => {
        return null;
      });

    const { FieldError } = createComponents(subscribeAction);

    function SubscribeForm() {
      return (
        <Action action={subscribeAction} initialData={null}>
          <ActionForm>
            <input type="text" name="email" data-testid="email" />
            <FieldError name="email" />
            <button type="submit" data-testid="submit" />
          </ActionForm>
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
