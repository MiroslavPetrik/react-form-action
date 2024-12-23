"use client";

import React, { type PropsWithChildren } from "react";
import { type ZodFormattedError } from "zod";
import type { FormAction } from "./createFormAction";
import { useActionContext } from "./Action";
import { InferZodErrorPaths, ZodFieldError } from "./ZodFieldError";

/**
 * Creates a typed components for actions created with the formAction builder.
 */
export function createComponents<
  Data,
  Error,
  ValidationError extends ZodFormattedError<any>,
>(action: FormAction<Data, Error, ValidationError>) {
  function FieldError({
    name,
  }: PropsWithChildren<{ name?: "" | InferZodErrorPaths<ValidationError> }>) {
    const { isInvalid, validationError } = useActionContext(action);

    return isInvalid && <ZodFieldError errors={validationError} name={name} />;
  }

  return {
    FieldError,
  };
}
