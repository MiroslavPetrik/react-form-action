"use client";

import React, { useTransition } from "react";
import type { FormHTMLAttributes, FormEvent } from "react";
import type { RenderProp } from "react-render-prop-type";
import type {
  FormState,
  InitialState,
  InvalidState,
  FailureState,
  SuccessState,
} from "./createFormAction";
import { useActionState } from "react";

export type FormStateProps<Data, Error, ValidationError, Payload> = {
  action: (
    state: FormState<Data, Error, ValidationError>,
    payload: Payload
  ) => Promise<FormState<Data, Error, ValidationError>>;
  initialData: Data;
  permalink?: string;
  /**
   * Opt-in into automatic form reset by using the form "action" prop.
   * By default, the onSubmit with a custom transition which opts-out of the implicit form reset.
   * See for more. https://github.com/facebook/react/issues/29034
   * @default false
   */
  autoReset?: boolean;
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

export type FormMetaState<T extends FormState<unknown, unknown, unknown>> = T &
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
  autoReset = false,
  ...props
}: FormProps<Data, Error, ValidationError>) {
  const [state, formAction, isPending] = useActionState(
    action,
    initial(initialData),
    permalink
  );
  const [, startTransition] = useTransition();

  const metaState =
    state.type === "initial"
      ? { ...state, ...neverMetaState, isPending, isInitial: true as const }
      : state.type === "invalid"
        ? { ...state, ...neverMetaState, isPending, isInvalid: true as const }
        : state.type === "failure"
          ? { ...state, ...neverMetaState, isPending, isFailure: true as const }
          : {
              ...state,
              ...neverMetaState,
              isPending,
              isSuccess: true as const,
            };

  const submitStrategy = autoReset
    ? { action: formAction }
    : {
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(() => {
            formAction(new FormData(form));
          });
        },
      };

  return (
    <form {...submitStrategy} {...props}>
      {children(metaState)}
    </form>
  );
}
