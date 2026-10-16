import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { Action } from "./Action";
import { Form } from "./Form";
import { formAction } from "./formAction";
import { Submit } from "./Submit";

describe("Submit", () => {
  function SubmitButton() {
    return (
      <Submit>
        {({ disabled, pending }) => (
          <button type="submit" disabled={disabled}>
            {pending ? "Submitting..." : "Submit"}
          </button>
        )}
      </Submit>
    );
  }

  const neverResolve = formAction.run(async () => {
    await new Promise(() => {
      /* never resolve */
    });
    return null;
  });

  test("it disables all submits within the ActionContext, but pending only the submitted one", async () => {
    function Test() {
      return (
        <Action action={neverResolve} initialData={null}>
          <Form>
            <SubmitButton />
          </Form>
          <Form>
            <SubmitButton />
          </Form>
        </Action>
      );
    }

    render(<Test />);

    const submits = screen.getAllByRole("button", { name: "Submit" });

    expect(submits[0]).not.toBeDisabled();
    expect(submits[1]).not.toBeDisabled();
    expect(submits[0]).toHaveTextContent("Submit");
    expect(submits[1]).toHaveTextContent("Submit");

    const last = submits.at(-1);

    if (last) await act(() => userEvent.click(last));

    expect(submits[0]).toBeDisabled();
    expect(submits[1]).toBeDisabled();
    expect(submits[0]).toHaveTextContent("Submit");
    expect(submits[1]).toHaveTextContent("Submitting...");
  });
});
