"use client";
import React from "react";
import type { FormHTMLAttributes } from "react";
import type { RenderProp } from "react-render-prop-type";
import type {
  FormState,
  InitialState,
  InvalidState,
  FailureState,
  SuccessState,
} from "./createFormAction";
import { useFormState } from "react-dom";
import { FormStatus } from "./FormStatus";

type FormStateProps<Data, ValidationError, Error, Payload> = {
  action: (
    state: FormState<Data, ValidationError, Error>,
    payload: Payload
  ) => Promise<FormState<Data, ValidationError, Error>>;
  initialData: Data;
  permalink?: string;
};

export function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

type FormMetaState<T extends FormState<unknown, unknown, unknown>> = T & {
  isPending: boolean;
  isInitial: T["type"] extends "initial" ? true : false;
  isFailure: T["type"] extends "failure" ? true : false;
  isSuccess: T["type"] extends "success" ? true : false;
  isInvalid: T["type"] extends "invalid" ? true : false;
};

export function Form<Data, ValidationError, Error>({
  children,
  action,
  initialData,
  permalink,
  ...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children"> &
  FormStateProps<Data, ValidationError, Error, FormData> &
  RenderProp<
    | FormMetaState<InitialState<Data>>
    | FormMetaState<InvalidState<Error>>
    | FormMetaState<FailureState<Error>>
    | FormMetaState<SuccessState<Data>>
  >) {
  const [state, formAction] = useFormState(
    action,
    initial(initialData),
    permalink
  );

  return (
    <form action={formAction} {...props}>
      <FormStatus>
        {({ pending }) =>
          // @ts-expect-error unnarrowed booleans
          children({
            ...state,
            isPending: pending,
            isInitial: state.type === "initial",
            isInvalid: state.type === "invalid",
            isFailure: state.type === "failure",
            isSuccess: state.type === "success",
          })
        }
      </FormStatus>
    </form>
  );
}
