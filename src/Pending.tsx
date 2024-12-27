import type { PropsWithChildren } from "react";
import type { RP } from "react-render-prop-type";

import { useActionContext } from "./Action";

/**
 * Conditionally renders the children, when the form action is in the "pending" state.
 */
export function Pending({
  children,
}: PropsWithChildren | RP<{ isPending: boolean }>) {
  const { isPending } = useActionContext();

  if (typeof children === "function") {
    return children({ isPending });
  }

  return isPending && children;
}
