"use client";

import { useEffect } from "react";
import { useActionContext } from "./Action";

/**
 * Hook to automatically reset the action when the component unmounts, unless it is in the initial state.
 */
export function useResetAction() {
  const { reset, isInitial } = useActionContext();

  useEffect(() => {
    return () => {
      if (!isInitial) {
        reset();
      }
    };
  }, [isInitial, reset]);
}

/**
 * Component that automatically resets the action when it unmounts, unless it is in the initial state.
 */
export function ResetAction() {
  useResetAction();
  return null;
}
