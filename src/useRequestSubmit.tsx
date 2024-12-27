import React, { type JSX, useRef } from "react";

export function useRequestSubmit() {
  const ref = useRef<HTMLFormElement>(null);

  function SubmitButton(props: JSX.IntrinsicElements["input"]) {
    return (
      <input
        {...props}
        type="submit"
        onClick={(event) => {
          event.preventDefault();

          console.log("requestSubmit");
          ref.current?.requestSubmit();
        }}
      />
    );
  }

  return { ref, SubmitButton };
}
