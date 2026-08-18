"use client";

import type React from "react";
import type { PropsWithChildren } from "react";
import type { $ZodErrorTree } from "zod/v4/core";
import type { SpreadActionContext } from "./Action";
import { useActionContext } from "./Action";
import type { FormAction } from "./createFormAction";
import type { Flatten } from "./formAction";
import {
  type InferZodErrorPaths,
  noError,
  ZodFieldError,
  type ZodFieldErrorChildrenProps,
} from "./ZodFieldError";

type Reducers<State = unknown> = Record<string, (state: State) => unknown>;

// biome-ignore lint/suspicious/noExplicitAny: ok
type InferFieldProps<T extends Reducers<any>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

/**
 * Creates a typed components for actions created with the formAction builder.
 */
export function createComponents<
  Data,
  Error,
  // biome-ignore lint/suspicious/noExplicitAny: ok
  ValidationError extends $ZodErrorTree<any>,
  Args extends unknown[] = [],
  FieldReducers extends Reducers<
    SpreadActionContext<Data, Error, ValidationError>
  > = Reducers<SpreadActionContext<Data, Error, ValidationError>>,
>(
  action: FormAction<Data, Error, ValidationError, FormData, Args>,
  options: {
    fieldProps?: FieldReducers;
  } = {},
) {
  type FieldProps = InferFieldProps<FieldReducers>;

  function FieldError<Name extends "" | InferZodErrorPaths<ValidationError>>({
    name,
    children,
  }: {
    name: Name;
    children?: (
      props: Flatten<ZodFieldErrorChildrenProps<Name> & FieldProps>,
    ) => React.ReactNode;
  }) {
    const state = useActionContext(action);

    const { isInvalid, validationError } = state;
    const defaultChildren = ({ error }: ZodFieldErrorChildrenProps<Name>) =>
      isInvalid && <>{error}</>;

    const fieldProps = Object.fromEntries(
      Object.entries(options.fieldProps ?? {}).map(([prop, reducer]) => [
        prop,
        reducer(state),
      ]),
    );

    const render = children ?? defaultChildren;

    return (
      // @ts-expect-error fine
      <ZodFieldError errors={validationError ?? noError} name={name}>
        {/** @ts-expect-error empty name ("") is fine */}
        {(errorProps) => render({ ...errorProps, ...fieldProps })}
      </ZodFieldError>
    );
  }

  function Success({
    children,
  }:
    | PropsWithChildren
    | {
        children?: (
          props:
            | { isSuccess: false; data: Data | null }
            | { isSuccess: true; data: Data },
        ) => React.ReactNode;
      }) {
    const { isSuccess, data } = useActionContext(action);

    if (typeof children === "function") {
      // return children({ isSuccess, data });
      if (isSuccess) {
        return children({ isSuccess, data });
      } else {
        return children({ isSuccess, data });
      }
    }

    return isSuccess && children;
  }

  function Invalid({
    children,
  }:
    | PropsWithChildren
    | {
        children?: (
          props:
            | { isInvalid: false; validationError: null }
            | { isInvalid: true; validationError: ValidationError },
        ) => React.ReactNode;
      }) {
    const { isInvalid, validationError } = useActionContext(action);

    if (typeof children === "function") {
      if (isInvalid) {
        return children({ isInvalid, validationError });
      } else {
        return children({ isInvalid, validationError });
      }
    }

    return isInvalid && children;
  }

  return {
    FieldError,
    Success,
    Invalid,
  };
}
