"use client";

import {
  createContext,
  type PropsWithChildren,
  startTransition,
  use,
  useActionState,
  useCallback,
} from "react";
import type {
  ActionState,
  FailureState,
  FormAction,
  InitialState,
  InvalidState,
  SuccessState,
} from "./createFormAction";
import { createFormAction, initial } from "./createFormAction";
import type { Flatten } from "./formAction";
import { ResetAction } from "./useResetAction";

export type ActionProps<
  Data,
  Error,
  ValidationError,
  Arguments extends unknown[] = [],
> = PropsWithChildren<
  {
    /**
     * Whether the form action should automatically reset when unmounted.
     */
    autoReset?: boolean;
    /**
     * A function to validate the form data before submission.
     * When the function returns a ValidationError value, the action state will turn to "invalid".
     * Return nullable value, to proceed with the submission.
     */
    validate?: (payload: FormData) => ValidationError | undefined | null;
    permalink?: string;
    initialData: Data;
  } & (Arguments extends [unknown, ...unknown[]]
    ? {
        action: FormAction<Data, Error, ValidationError, FormData, Arguments>;
        args: Arguments;
      }
    : {
        action: FormAction<Data, Error, ValidationError, FormData, Arguments>;
        args?: undefined;
      })
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
> = Flatten<
  T &
    ActionStatusFlags<T["type"]> & {
      /**
       * The dispatch function returned from React.useActionState()
       */
      action: (payload: FormData) => void;
      /**
       * A function to reset the form action state to its initial state.
       */
      reset: () => void;
      isPending: boolean;
    }
>;

const neverMetaState: ActionStatusFlags = {
  isInitial: false,
  isInvalid: false,
  isFailure: false,
  isSuccess: false,
};

/**
 * NOTE: ActionContextState<ActionState<...>> would not allow discriminate the union inside of the ActionState.
 */
export type SpreadActionContext<
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
>(_action?: FormAction<Data, Error, ValidationError, FormData, Args>) {
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
  validate,
  autoReset,
}: ActionProps<Data, Error, ValidationError, Args>) {
  type NoArgsAction = FormAction<Data, Error, ValidationError, FormData, []>;

  const argAction = (
    args ? formAction.bind(null, ...args) : formAction
  ) as NoArgsAction;

  const [state, action, isPending] = useActionState(
    // biome-ignore lint/suspicious/noExplicitAny: fine
    async (state: any, payload: FormData | null) => {
      if (payload === null) {
        return initial(initialData);
      }

      if (validate) {
        const clientValidateAction = createFormAction(
          ({ invalid, success }) => {
            return async (_, payload) => {
              const errors = validate(payload);

              if (errors) {
                return invalid(errors);
              }

              return success(true);
            };
          },
        );

        const clientValidationResult = await clientValidateAction(
          state,
          payload,
        );

        if (clientValidationResult.type === "invalid") {
          return clientValidationResult;
        }
      }

      return argAction(state, payload);
    },
    initial(initialData),
    permalink,
  );

  const reset = useCallback(() => {
    startTransition(() => {
      action(null);
    });
  }, [action]);

  const dispatch = {
    action,
    reset,
    isPending,
  };

  const context =
    state.type === "initial"
      ? {
          ...dispatch,
          ...state,
          ...neverMetaState,
          isInitial: true as const,
        }
      : state.type === "invalid"
        ? {
            ...dispatch,
            ...state,
            ...neverMetaState,
            isInvalid: true as const,
          }
        : state.type === "failure"
          ? {
              ...dispatch,
              ...state,
              ...neverMetaState,
              isFailure: true as const,
            }
          : {
              ...dispatch,
              ...state,
              ...neverMetaState,
              isSuccess: true as const,
            };

  return (
    <ActionContext value={context}>
      {autoReset && <ResetAction />}
      {children}
    </ActionContext>
  );
}
