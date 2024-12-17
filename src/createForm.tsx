import React, { type PropsWithChildren } from "react";
import type { FormAction } from "./createFormAction";
import { Form as BaseForm } from "./Form";
import { FormContext } from "./FormContext";

/**
 * Creates a Form component which state is accessible via context - useFormContext() hook.
 */
export function createForm<
  Data,
  Error = Data,
  ValidationError = Record<string, never>,
>(action: FormAction<Data, Error, ValidationError>) {
  const Form = ({
    children,
    ...props
  }: PropsWithChildren<{ initialData: Data }>) => {
    return (
      <BaseForm action={action} {...props}>
        {(state) => <FormContext value={state}>{children}</FormContext>}
      </BaseForm>
    );
  };

  return {
    Form,
  };
}
