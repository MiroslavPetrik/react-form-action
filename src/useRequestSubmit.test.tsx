import React from "react";
import { vi, describe, test, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useRequestSubmit } from "./useRequestSubmit";

describe("useRequestSubmit", () => {
  test("it submits the form having action prop without error", async () => {
    function Test({ onSearch }: { onSearch: (query: string) => void }) {
      const { ref, SubmitButton } = useRequestSubmit();

      function search(formData: FormData) {
        console.log("search", [...formData]);
        onSearch(formData.get("query") as string);
      }

      return (
        <form action={search}>
          <input name="query" data-testid="query" />
          <input type="submit" data-testid="no-request" />
          <SubmitButton data-testid="submit" />
        </form>
      );
    }

    const searchSpy = vi.fn(() => {});

    render(<Test onSearch={searchSpy} />);

    await act(() => userEvent.type(screen.getByTestId("query"), "works"));
    await act(() => userEvent.click(screen.getByTestId("no-request")));

    expect(searchSpy).toHaveBeenCalledWith("works");
  });
});
