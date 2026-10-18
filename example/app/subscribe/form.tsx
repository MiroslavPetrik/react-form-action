"use client";

import {
  createComponents,
  Form,
  useActionContext,
} from "react-form-action/client";

import { subscribeAction } from "./action";

const { FieldError, Success } = createComponents(subscribeAction);

function ErrorMessage() {
  const { isFailure, error } = useActionContext(subscribeAction);

  return isFailure && error;
}

export function SubscribeForm() {
  const { isPending, isInvalid, isInitial, isFailure } = useActionContext();

  return (
    <Form>
      <Success>
        <div>Subscribed!</div>
      </Success>
      <ErrorMessage />
      <div>
        <input
          name="email"
          placeholder="your@email.com"
          aria-invalid={isInitial ? undefined : isFailure || isInvalid}
          aria-describedby="invalid-helper"
        />
        <small id="invalid-helper">
          <FieldError name="email" />
        </small>
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "Subscribing..." : "Subscribe"}
      </button>
    </Form>
  );
}
