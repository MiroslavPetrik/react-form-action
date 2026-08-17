import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { Action } from "./Action";
import { createComponents } from "./createComponents";
import { Form } from "./Form";
import { formAction } from "./formAction";
import { validateSchema } from "./validateSchema";

describe("validateSchema", () => {
  test("it works with formActions", async () => {
    const subscribeSchema = z.object({
      email: z.email(),
    });

    const subscribeAction = vi.fn(
      formAction.input(subscribeSchema).run(async () => {
        return null;
      }),
    );

    const { FieldError } = createComponents(subscribeAction);

    function SubscribeForm() {
      return (
        <Action
          action={subscribeAction}
          initialData={null}
          validate={validateSchema(subscribeSchema)}
        >
          <Form>
            <input type="text" name="email" data-testid="email" />
            <FieldError name="email" />
            <button type="submit" data-testid="submit" />
          </Form>
        </Action>
      );
    }

    render(<SubscribeForm />);

    await act(() => userEvent.type(screen.getByTestId("email"), "fake"));
    await act(() => userEvent.click(screen.getByTestId("submit")));

    expect(subscribeAction).not.toHaveBeenCalled();
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });
});
