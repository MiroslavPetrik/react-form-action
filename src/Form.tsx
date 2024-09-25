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
    payload: Payload,
  ) => Promise<FormState<Data, Error, ValidationError>>;
  initialData: Data;
  permalink?: string;
};

export function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

type FormStatusFlags<
  T extends FormState<unknown, unknown, unknown>["type"] | unknown = unknown,
> = {
  isInitial: T extends "initial" ? true : false;
  isInvalid: T extends "invalid" ? true : false;
  isFailure: T extends "failure" ? true : false;
  isSuccess: T extends "success" ? true : false;
};

type FormMetaState<T extends FormState<unknown, unknown, unknown>> = T &
  FormStatusFlags<T["type"]> & {
    isPending: boolean;
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

const neverMetaState: FormStatusFlags = {
  isInitial: false,
  isInvalid: false,
  isFailure: false,
  isSuccess: false,
};

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
    permalink,
  );

  const metaState =
    state.type === "initial"
      ? { ...state, ...neverMetaState, isInitial: true as const }
      : state.type === "invalid"
        ? { ...state, ...neverMetaState, isInvalid: true as const }
        : state.type === "failure"
          ? { ...state, ...neverMetaState, isFailure: true as const }
          : { ...state, ...neverMetaState, isSuccess: true as const };

  return (
    <form action={formAction} {...props}>
      <FormStatus>
        {({ pending }) =>
          children({
            ...metaState,
            isPending: pending,
          })
        }
      </FormStatus>
    </form>
  );
}
