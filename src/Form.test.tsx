import React, { useRef } from "react";

import { describe, test, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { Form } from "./Form";

import { Action } from "./Action";
import { formAction } from ".";

describe("Form", () => {
  test("it accepts ref", async () => {
    const action = formAction.run(async () => null);

    function Demo({ onSubmit }: { onSubmit: (expected: boolean) => void }) {
      const ref = useRef(null);

      return (
        <Action action={action} initialData={null}>
          <Form
            ref={ref}
            onSubmit={(event) => {
              onSubmit(event.currentTarget === ref.current);
            }}
          >
            <input type="submit" data-testid="submit" />
          </Form>
        </Action>
      );
    }

    const spy = vi.fn((expected: boolean) => {});

    render(<Demo onSubmit={spy} />);

    await act(() => userEvent.click(screen.getByTestId("submit")));

    expect(spy).toHaveBeenCalledWith(true);
  });
});
