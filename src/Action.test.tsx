import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Activity } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { Action, useActionContext } from "./Action";
import { createComponents } from "./createComponents";
import { Form } from "./Form";
import { formAction } from "./formAction";

describe("Action", () => {
  beforeEach(() => {
    z.config(z.locales.en());
  });

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

  describe("reset function", () => {
    test("it resets the form action state to its initial state", async () => {
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

      function ResetButton() {
        const { reset } = useActionContext();
        return (
          <button type="button" data-testid="reset" onClick={reset}>
            Reset
          </button>
        );
      }

      function SubscribeForm() {
        return (
          <Action action={subscribeAction} initialData={null}>
            <Form>
              <input type="text" name="email" data-testid="email" />
              <FieldError name="email" />
              <button type="submit" data-testid="submit" />
              <ResetButton />
            </Form>
          </Action>
        );
      }

      render(<SubscribeForm />);

      await act(() => userEvent.type(screen.getByTestId("email"), "fake"));
      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByText("Invalid email address")).toBeInTheDocument();

      await act(() => userEvent.click(screen.getByTestId("reset")));

      expect(
        screen.queryByText("Invalid email address"),
      ).not.toBeInTheDocument();
    });
  });

  describe("autoReset prop, resetting the action state when unmounted", () => {
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

    function SubscribeForm({
      unmounted,
      autoReset = true,
    }: {
      unmounted?: boolean;
      autoReset?: boolean;
    }) {
      return (
        <Activity mode={unmounted ? "hidden" : undefined}>
          <Action
            action={subscribeAction}
            initialData={null}
            autoReset={autoReset}
          >
            <Form>
              <input type="text" name="email" data-testid="email" />
              <FieldError name="email" />
              <button type="submit" data-testid="submit" />
            </Form>
          </Action>
        </Activity>
      );
    }

    test("when autoReset=true (default), it resets the action state", async () => {
      const { rerender } = render(<SubscribeForm />);

      await act(() => userEvent.type(screen.getByTestId("email"), "fake"));
      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByText("Invalid email address")).toBeInTheDocument();

      await act(async () => rerender(<SubscribeForm unmounted />));

      expect(
        screen.queryByText("Invalid email address"),
      ).not.toBeInTheDocument();
    });

    test("when autoReset=false, it does not reset the action state automatically", async () => {
      const { rerender } = render(<SubscribeForm autoReset={false} />);

      await act(() => userEvent.type(screen.getByTestId("email"), "fake"));
      await act(() => userEvent.click(screen.getByTestId("submit")));

      expect(screen.getByText("Invalid email address")).toBeInTheDocument();

      await act(async () =>
        rerender(<SubscribeForm unmounted autoReset={false} />),
      );

      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });
});
