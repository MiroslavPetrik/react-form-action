"use client";

import { createContext, use } from "react";
import type { FormState } from "./createFormAction";
import type { FormMetaState } from "./Form";

/**
 * A context exposing the form action state.
 * @private You don't need to use this component directly. Use the `createForm` function instead.
 */
export const FormContext = createContext<FormMetaState<
  FormState<unknown, unknown, unknown>
> | null>(null);

/**
 * A hook to consume the form action state from the context.
 */
export const useFormContext = () => {
  const ctx = use(FormContext);

  if (!ctx) {
    throw new Error("Form Context must be initialized before use.");
  }

  return ctx;
};
