import { type PropsWithChildren } from "react";
import { useActionContext } from "./Action";

/**
 * Conditionally renders the children, when the form action is in the "pending" state.
 */
export function Pending({ children }: PropsWithChildren) {
  const { isPending } = useActionContext();

  return isPending && children;
}
