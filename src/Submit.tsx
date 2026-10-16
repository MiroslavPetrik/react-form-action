"use client";

import type { ReactNode } from "react";
import { type FormStatus, useFormStatus } from "react-dom";
import { useActionContext } from "./Action";

type SubmitChildrenProps = FormStatus & {
  /**
   * Whether the **action** is pending. It will disable the submit button when true.
   */
  disabled: boolean;
};

type SubmitProps = {
  /**
   * A render prop to render the submit button.
   */
  children: (props: SubmitChildrenProps) => ReactNode;
};

/**
 * A submit status component that tracks both the action & form pending states.
 * NOTE: must be rendered within a <form>.
 */
export function Submit({ children }: SubmitProps) {
  const { isPending: disabled } = useActionContext();
  const status = useFormStatus();

  return children({ ...status, disabled });
}
