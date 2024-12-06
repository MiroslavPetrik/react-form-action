"use client";

import React from "react";
import type { ZodFormattedError } from "zod";
import type { RenderProp } from "react-render-prop-type";

const SEPARATOR = "." as const;

export type Paths<Err> = {
  [k in keyof Err]: k extends string
    ? Err[k] extends object
      ? `${k}${typeof SEPARATOR}${Paths<Err[k]>}`
      : k
    : never;
}[keyof Err];

export type InferZodErrorPaths<Errors> =
  Errors extends ZodFormattedError<infer E> ? Paths<E> : never;

export type ZodFieldErrorProps<Errors extends ZodFormattedError<any>> = {
  errors: Errors;
  name?: "" | InferZodErrorPaths<Errors>;
} & Partial<RenderProp<{ errors: readonly string[] }>>;

const noError = Object.freeze({ _errors: Object.freeze([]) });

export function ZodFieldError<Errors extends ZodFormattedError<any>>({
  errors,
  name = "",
  children = ({ errors }) => <>{errors[0]}</>,
}: ZodFieldErrorProps<Errors>) {
  // checking length avoids narroving name to never, which happens by truthines check e.g. !!name
  if (name.length === 0) {
    return children({ errors: errors._errors });
  }

  const path = name.split(SEPARATOR);

  let error = errors;
  while (path.length) {
    const key = path.shift()!;
    // @ts-expect-error static type does not know depth
    error = error[key] ?? noError;
  }

  return children({ errors: error._errors });
}
