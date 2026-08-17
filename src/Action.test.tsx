import React from "react";
import { describe, test, expect, vi } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { z } from "zod";

import { Action } from "./Action";
import { formAction } from "./formAction";
import { Form } from "./Form";

import { createComponents } from "./createComponents";

import { zfd } from "zod-form-data";

describe("Action", () => {
  test("it enables form to consume action via context", async () => {
    const subscribeAction = vi.fn(
      formAction
        .input(
          z.object({
            email: z.email(),
          }),
        )
        .run(async () => {
          return null;
        }),
    );

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

    expect(subscribeAction).toHaveBeenCalled();
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });

  describe("with formAction having .args()", () => {
    const helloAction = formAction
      .args([z.enum(["sk", "en"])])
      .args([z.boolean()])
      .run(async ({ args: [locale, strong] }) => {
        const msg = locale === "sk" ? "Ahoj" : "Hello";

        return strong ? `${msg}!` : msg;
      });

    const { Success } = createComponents(helloAction);

    test("it binds the args from the props", async () => {
      function HelloForm() {
        return (
          <Action args={["sk", true]} action={helloAction} initialData="">
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

      expect(screen.getByTestId("success")).toHaveTextContent("Ahoj!");
    });

    test("it works without the args prop", async () => {
      const manualBind = helloAction.bind(null, "en", false);

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

  describe("validate prop", () => {
    test("it runs the client validation before the action", async () => {
      const subscribeAction = vi.fn(
        formAction
          .input(
            z.object({
              email: z.email(),
            }),
          )
          .run(async () => {
            return null;
          }),
      );

      const { FieldError } = createComponents(subscribeAction);

      function clientValidate(payload: FormData) {
        z.config(z.locales.cs());

        const schema = z.object({
          email: z.email(),
        });

        const result = zfd.formData(schema).safeParse(payload);

        if (result.error) {
          return z.treeifyError(result.error);
        }

        return null;
      }

      function SubscribeForm() {
        return (
          <Action
            action={subscribeAction}
            initialData={null}
            validate={clientValidate}
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

      expect(
        screen.getByText("Neplatný formát e-mailová adresa"),
      ).toBeInTheDocument();
      expect(subscribeAction).not.toHaveBeenCalled();
    });
  });
});
