"use client";

import type { ReactNode } from "react";
import {
  Form,
  Submit,
  createComponents,
  useActionContext,
} from "react-form-action/client";

import { followRequestAction } from "./action";

const { Success, Value } = createComponents(followRequestAction);

const messages = {
  accept: "Request accepted. xyz now follows you.",
  reject: "Request rejected.",
  block: "xyz has been blocked.",
};

function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <Submit>
      {({ pending, disabled }) => (
        // 👉 `disabled` reflects the action state, `pending` the form submission
        <button type="submit" className={className} disabled={disabled}>
          {pending ? pendingLabel : children}
        </button>
      )}
    </Submit>
  );
}

function Result() {
  const { isSuccess, data } = useActionContext(followRequestAction);

  return isSuccess ? <p>{messages[data]}</p> : null;
}

export function FollowRequestForm() {
  return (
    <article>
      <header>
        Follow Request
      </header>
      <p>
        User <strong>xyz</strong> wants to follow you.
      </p>
      <Success>
        <Result />
      </Success>
      <footer>
      <div className="grid">
        <Form>
          <Value name="decision" value="accept" />
          <SubmitButton pendingLabel="Accepting...">Accept</SubmitButton>
        </Form>
        <Form>
          <Value name="decision" value="reject" />
          <SubmitButton pendingLabel="Rejecting..." className="secondary">
            Reject
          </SubmitButton>
        </Form>
        <Form>
          <Value name="decision" value="block" />
          <SubmitButton pendingLabel="Blocking..." className="contrast">
            Block
          </SubmitButton>
        </Form>
      </div>
      </footer>
    </article>
  );
}
