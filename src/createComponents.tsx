"use client";

import React, { type PropsWithChildren } from "react";
import type { $ZodErrorTree } from "zod/v4/core";

import type { FormAction } from "./createFormAction";
import { useActionContext } from "./Action";
import {
  ZodFieldErrorChildrenProps,
  InferZodErrorPaths,
  ZodFieldError,
  noError,
} from "./ZodFieldError";

/**
 * Creates a typed components for actions created with the formAction builder.
 */
export function createComponents<
  Data,
  Error,
  ValidationError extends $ZodErrorTree<any>,
>(action: FormAction<Data, Error, ValidationError>) {
  function FieldError<Name extends "" | InferZodErrorPaths<ValidationError>>({
    name,
    children,
  }: {
    name: Name;
    children?: (props: ZodFieldErrorChildrenProps<Name>) => React.ReactNode;
  }) {
    const { isInvalid, validationError } = useActionContext(action);

    const defaultChildren = ({ error }: ZodFieldErrorChildrenProps<Name>) =>
      isInvalid && <>{error}</>;

    return (
      // @ts-expect-error fine
      <ZodFieldError errors={validationError ?? noError} name={name}>
        {/** @ts-expect-error fine */}
        {children ?? defaultChildren}
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
            | { isSuccess: true; data: Data }
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

  return {
    FieldError,
    Success,
  };
}
