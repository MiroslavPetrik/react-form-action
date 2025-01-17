"use client";

import React, { type PropsWithChildren } from "react";
import type { ZodFormattedError } from "zod";
import type { RenderProp, RP } from "react-render-prop-type";

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
  ValidationError extends ZodFormattedError<any>,
>(action: FormAction<Data, Error, ValidationError>) {
  function FieldError<Name extends "" | InferZodErrorPaths<ValidationError>>({
    name,
    children,
  }: { name: Name } & Partial<RenderProp<ZodFieldErrorChildrenProps<Name>>>) {
    const { isInvalid, validationError } = useActionContext(action);

    const defaultChildren = ({ error }: ZodFieldErrorChildrenProps<Name>) =>
      isInvalid && <>{error}</>;

    return (
      // @ts-expect-error readonly is fine
      <ZodFieldError errors={validationError ?? noError} name={name}>
        {children ?? defaultChildren}
      </ZodFieldError>
    );
  }

  function Success({
    children,
  }:
    | PropsWithChildren
    | RP<
        | { isSuccess: false; data: Data | null }
        | { isSuccess: true; data: Data }
      >) {
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
