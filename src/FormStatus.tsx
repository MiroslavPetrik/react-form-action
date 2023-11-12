"use client";
import type { RenderProp } from "react-render-prop-type";
import { useFormStatus } from "react-dom";

export function FormStatus({
  children,
}: RenderProp<ReturnType<typeof useFormStatus>>) {
  return children(useFormStatus());
}
