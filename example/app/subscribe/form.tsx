"use client";

import {
  Form,
  createComponents,
  useActionContext,
} from "react-form-action/client";

import { subscribeAction } from "./action";

const { FieldError, Success } = createComponents(subscribeAction);

function Error() {
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
      <Error />
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
