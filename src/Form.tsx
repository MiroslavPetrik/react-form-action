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

export type FormStateProps<Data, Error, ValidationError, Payload> = {
  action: (
    state: FormState<Data, Error, ValidationError>,
    payload: Payload
  ) => Promise<FormState<Data, Error, ValidationError>>;
  initialData: Data;
  permalink?: string;
};

export function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

type FormMetaState<T extends FormState<unknown, unknown, unknown>> = T & {
  isPending: boolean;
  isInitial: T["type"] extends "initial" ? true : false;
  isInvalid: T["type"] extends "invalid" ? true : false;
  isFailure: T["type"] extends "failure" ? true : false;
  isSuccess: T["type"] extends "success" ? true : false;
};

export type FormProps<Data, Error, ValidationError> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "children"
> &
  FormStateProps<Data, Error, ValidationError, FormData> &
  RenderProp<
    | FormMetaState<InitialState<Data>>
    | FormMetaState<InvalidState<ValidationError>>
    | FormMetaState<FailureState<Error>>
    | FormMetaState<SuccessState<Data>>
  >;

export function Form<Data, Error, ValidationError>({
  children,
  action,
  initialData,
  permalink,
  ...props
}: FormProps<Data, Error, ValidationError>) {
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
