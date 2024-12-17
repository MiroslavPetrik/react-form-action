import React, { createContext, use, type PropsWithChildren } from "react";
import type { FormAction, FormState } from "./createFormAction";
import { Form, type FormMetaState } from "./Form";

const FormContext = createContext<FormMetaState<
  FormState<unknown, unknown, unknown>
> | null>(null);

const useFormContext = () => {
  const ctx = use(FormContext);

  if (!ctx) {
    throw new Error("Form Context must be initialized before use.");
  }

  return ctx;
};

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
