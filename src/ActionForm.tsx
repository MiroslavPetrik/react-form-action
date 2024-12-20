"use client";

import React, { startTransition } from "react";
import type { FormHTMLAttributes, FormEvent } from "react";

import { useActionContext } from "./Action";

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  /**
   * Opt-in into automatic form reset by using the form "action" prop.
   * By default, the onSubmit with a custom transition which opts-out of the implicit form reset.
   * See for more. https://github.com/facebook/react/issues/29034
   * @default false
   */
  autoReset?: boolean;
};

export function ActionForm({ autoReset = false, ...props }: FormProps) {
  const { action } = useActionContext();

  const submitStrategy = autoReset
    ? { action }
    : {
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = event.currentTarget;
          startTransition(() => {
            action(new FormData(form));
          });
        },
      };

  return <form {...submitStrategy} {...props} />;
}
