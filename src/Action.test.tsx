import React from "react";
import { describe, test, expect } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod/v4";

import { Action } from "./Action";
import { formAction } from "./formAction";
import { Form } from "./Form";

import { createComponents } from "./createComponents";

describe("Action", () => {
  test("it enables form to consume action via context", async () => {
    const subscribeAction = formAction
      .input(
        z.object({
          email: z.email(),
        }),
      )
      .run(async () => {
        return null;
      });

    const { FieldError } = createComponents(subscribeAction);

    function SubscribeForm() {
      return (
        <Action action={subscribeAction} initialData={null}>
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

    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });

  describe("with formAction having .args()", () => {
    const helloAction = formAction
      .args([z.enum(["sk", "en"])])
      .run(async ({ args: [locale] }) => {
        if (locale === "sk") return "Ahoj";
        else return "Hello" as string;
      });

    const { Success } = createComponents(helloAction);

    test("it binds the args from the props", async () => {
      function HelloForm() {
        return (
          <Action action={helloAction} args={["sk"]} initialData="">
            <Form>
              <button type="submit" data-testid="submit" />
              <Success>
                {({ isSuccess, data }) =>
                  isSuccess ? (
                    <output data-testid="success">{data}</output>
                  ) : null
                }
              </Success>
            </Form>
          </Action>
        );
      }

      render(<HelloForm />);

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByTestId("success")).toHaveTextContent("Ahoj");
    });

    test("it works without the args prop", async () => {
      const manualBind = helloAction.bind(null, "en");

      function HelloForm() {
        return (
          <Action action={manualBind} initialData="">
            <Form>
              <button type="submit" data-testid="submit" />
              <Success>
                {({ isSuccess, data }) =>
                  isSuccess ? (
                    <output data-testid="success">{data}</output>
                  ) : null
                }
              </Success>
            </Form>
          </Action>
        );
      }

      render(<HelloForm />);

      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByTestId("success")).toHaveTextContent("Hello");
    });
  });
});
