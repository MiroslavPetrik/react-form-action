import { type PropsWithChildren } from "react";
import { useFormContext } from "./FormContext";

/**
 * Conditionally renders the children, when the form action is in the "pending" state.
 */
export function Pending({ children }: PropsWithChildren) {
  const { isPending } = useFormContext();

  return isPending && children;
}
