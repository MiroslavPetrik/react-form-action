"use client";

import React, { type PropsWithChildren } from "react";
import { createContext, use } from "react";
import type { ActionState, InitialState, FormAction } from "./createFormAction";
import { useActionState } from "react";

export type ActionProps<Data, Error, ValidationError> = PropsWithChildren<{
  action: FormAction<Data, Error, ValidationError>;
  initialData: Data;
  permalink?: string;
}>;

function initial<Data>(data: Data): InitialState<Data> {
  return { type: "initial", data, error: null, validationError: null };
}

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
 * A context exposing the form action state.
 */
const ActionContext = createContext<ActionContextState<
  ActionState<unknown, unknown, unknown>
> | null>(null);

/**
 * A hook to consume the form action state from the context.
 */
export const useActionContext = () => {
  const ctx = use(ActionContext);

  if (!ctx) {
    throw new Error(
      "ActionContext must be initialized before use. Is your useActionContext hook wrapped with an <Action> Component?"
    );
  }

  return ctx;
};

export function Action<Data, Error, ValidationError>({
  children,
  action: formAction,
  initialData,
  permalink,
}: ActionProps<Data, Error, ValidationError>) {
  const [state, action, isPending] = useActionState(
    formAction,
    initial(initialData),
    permalink
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
