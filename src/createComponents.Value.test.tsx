import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { Action } from "./Action";
import { createComponents } from "./createComponents";
import { Form } from "./Form";
import { formAction } from "./formAction";

describe("Value", () => {
  const action = formAction
    .input(z.object({ decision: z.enum(["accept", "deny"]) }))
    .run(async ({ input: { decision } }) => {
      return `final-${decision}`;
    });

  const { Value, Success } = createComponents(action);

  test("sets value via hidden input", async () => {
    function Test() {
      return (
        <Action action={action} initialData={undefined as any}>
          <Success>{({ isSuccess, data }) => isSuccess && data}</Success>
          <Form>
            <Value name="decision" value="accept" />
            <button type="submit">accept</button>
          </Form>
          <Form>
            <Value name="decision" value="deny" />
            <button type="submit">deny</button>
          </Form>
        </Action>
      );
    }

    render(<Test />);

    await act(() => userEvent.click(screen.getByText("accept")));

    expect(screen.getByText("final-accept")).toBeInTheDocument();
  });
});
