import React, { type PropsWithChildren } from "react";
import type { FormAction } from "./createFormAction";
import { Form } from "./Form";
import { FormContext, useFormContext } from "./FormContext";

/**
 * Creates a Form component which state is accessible via context - useFormContext() hook.
 */
export function createForm<
  Data,
  Error = Data,
  ValidationError = Record<string, never>,
>(action: FormAction<Data, Error, ValidationError>) {
  const ContextForm = ({
    children,
    ...props
  }: PropsWithChildren<{ initialData: Data }>) => {
    return (
      <Form action={action} {...props}>
        {(state) => <FormContext value={state}>{children}</FormContext>}
      </Form>
    );
  };

  function Pending({ children }: PropsWithChildren) {
    const { isPending } = useFormContext();

    return isPending && children;
  }

  return {
    Form: ContextForm,
    Pending,
  };
}
