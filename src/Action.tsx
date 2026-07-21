"use client";

import React, { type PropsWithChildren } from "react";
import { useActionState, createContext, use } from "react";
import type {
  ActionState,
  InitialState,
  InvalidState,
  SuccessState,
  FailureState,
  FormAction,
} from "./createFormAction";
import { initial } from "./createFormAction";

export type ActionProps<
  Data,
  Error,
  ValidationError,
  Arguments extends unknown[] = [],
> = PropsWithChildren<
  Arguments extends [unknown, ...unknown[]]
    ? {
        action: FormAction<Data, Error, ValidationError, FormData, Arguments>;
        args: Arguments;
        initialData: Data;
        permalink?: string;
      }
    : {
        action: FormAction<Data, Error, ValidationError, FormData, Arguments>;
        initialData: Data;
        args?: undefined;
        permalink?: string;
      }
>;

type ActionStatusFlags<
  T extends ActionState<unknown, unknown, unknown>["type"] | unknown = unknown,
> = {
  isInitial: T extends "initial" ? true : false;
  isInvalid: T extends "invalid" ? true : false;
  isFailure: T extends "failure" ? true : false;
  isSuccess: T extends "success" ? true : false;
};

export type ActionContextState<
  T extends ActionState<unknown, unknown, unknown>,
> = T &
  ActionStatusFlags<T["type"]> & {
    /**
     * The dispatch function returned from React.useActionState()
     */
    action: (payload: FormData) => void;
    isPending: boolean;
  };

const neverMetaState: ActionStatusFlags = {
  isInitial: false,
  isInvalid: false,
  isFailure: false,
  isSuccess: false,
};

/**
 * NOTE: ActionContextState<ActionState<...>> would not allow discriminate the union inside of the ActionState.
 */
type SpreadActionContext<
  Data = unknown,
  Error = unknown,
  ValidationError = unknown,
> =
  | ActionContextState<InitialState<Data>>
  | ActionContextState<InvalidState<ValidationError>>
  | ActionContextState<FailureState<Error>>
  | ActionContextState<SuccessState<Data>>;

/**
 * A context exposing the form action state.
 */
const ActionContext = createContext<SpreadActionContext | null>(null);

/**
 * A hook to consume the form action state from the context.
 */
export function useActionContext<
  Data,
  Error,
  ValidationError,
  Args extends unknown[] = [],
>(action?: FormAction<Data, Error, ValidationError, FormData, Args>) {
  const ctx = use(ActionContext);

  if (!ctx) {
    throw new Error(
      "ActionContext must be initialized before use. Is your useActionContext hook wrapped with an <Action> Component?",
    );
  }

  // Generics shouldn't be used for explicit casts, I know
  return ctx as SpreadActionContext<Data, Error, ValidationError>;
}

export function Action<
  Data,
  Error,
  ValidationError,
  Args extends unknown[] = [],
>({
  children,
  action: formAction,
  initialData,
  args,
  permalink,
}: ActionProps<Data, Error, ValidationError, Args>) {
  type NoArgsAction = FormAction<Data, Error, ValidationError, FormData, []>;

  const argAction = (
    args ? formAction.bind(null, ...args) : formAction
  ) as NoArgsAction;

  const [state, action, isPending] = useActionState(
    argAction,
    initial(initialData),
    permalink,
  );

  const metaState =
    state.type === "initial"
      ? {
          ...state,
          ...neverMetaState,
          action,
          isPending,
          isInitial: true as const,
        }
      : state.type === "invalid"
        ? {
            ...state,
            ...neverMetaState,
            action,
            isPending,
            isInvalid: true as const,
          }
        : state.type === "failure"
          ? {
              ...state,
              ...neverMetaState,
              action,
              isPending,
              isFailure: true as const,
            }
          : {
              ...state,
              ...neverMetaState,
              action,
              isPending,
              isSuccess: true as const,
            };

  return <ActionContext value={metaState}>{children}</ActionContext>;
}
