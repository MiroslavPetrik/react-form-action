"use client";

import React from "react";
import type { $ZodErrorTree } from "zod/v4/core";
import type { RenderProp } from "react-render-prop-type";

const SEPARATOR = "." as const;

export type Paths<
  Shape extends $ZodErrorTree<object>,
  Props = Required<NonNullable<Shape["properties"]>>,
> = {
  [k in keyof Props]: k extends string
    ? NonNullable<Props[k]> extends $ZodErrorTree<object>
      ? "properties" extends keyof NonNullable<Props[k]>
        ? `${k}${typeof SEPARATOR}${Paths<NonNullable<Props[k]>>}`
        : k // leaf node
      : k
    : never;
}[keyof Props];

export type InferZodErrorPaths<T> =
  T extends $ZodErrorTree<object> ? Paths<T> : never;

export type ZodFieldErrorProps<
  Errors extends $ZodErrorTree<any>,
  Name extends "" | InferZodErrorPaths<Errors>,
> = {
  errors: Errors;
  name: Name;
} & Partial<RenderProp<ZodFieldErrorChildrenProps<Name>>>;

export type ZodFieldErrorChildrenProps<Name> = {
  name: Name;
  error?: string;
  errors: readonly string[];
};

export const noError = Object.freeze({
  errors: Object.freeze([] as string[]),
});

export function ZodFieldError<
  Errors extends $ZodErrorTree<object>,
  Name extends "" | InferZodErrorPaths<Errors> = "",
>({
  errors,
  name,
  children = ({ error }) => <>{error}</>,
}: ZodFieldErrorProps<Errors, Name>) {
  // checking length avoids narroving name to never, which happens by truthines check e.g. !!name
  if (name.length === 0) {
    return children({
      name,
      error: errors.errors[0],
      errors: errors.errors,
    });
  }

  const path = name.split(SEPARATOR);

  let error = errors;
  while (path.length) {
    const key = path.shift()!;

    if (!error.properties) {
      // @ts-expect-error non-existent property
      error = noError;
      break;
    }

    // @ts-expect-error accessing properties dynamically
    error = error["properties"][key] ?? noError;
  }

  return children({
    name,
    error: error.errors[0],
    errors: error.errors,
  });
}
