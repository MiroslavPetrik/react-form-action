import type { PropsWithChildren } from "react";

import { useActionContext } from "./Action";

/**
 * Conditionally renders the children, when the form action is in the "pending" state.
 */
export function Pending({
  children,
}:
  | PropsWithChildren
  | { children?: (props: { isPending: boolean }) => React.ReactNode }) {
  const { isPending } = useActionContext();

  if (typeof children === "function") {
    return children({ isPending });
  }

  return isPending && children;
}
