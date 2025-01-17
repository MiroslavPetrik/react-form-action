"use client";

import { useActionState } from "react";
import { updateUser } from "./action";
import { initial } from "react-form-action";
import Link from "next/link";

type Props = {
  userId: string;
};

export function UpdateUserForm({ userId }: Props) {
  const action = updateUser.bind(null, userId);

  const [state, formAction, pending] = useActionState(
    action,
    initial({ userId: "n/a" }) // TODO(#13)
  );

  return (
    <form action={formAction}>
      <input name="name" placeholder="Name" defaultValue="Jeff" />
      <button type="submit">{pending ? "submitting..." : "Submit"}</button>
      <p>
        {state.type === "success" ? `✅ Updated id ${state.data.userId}` : null}
        {state.type === "failure" ? `❌ ${state.error.message}` : null}
      </p>
      <ul>
        <li>
          <Link href="/update-user/9">Valid user</Link>
        </li>
        <li>
          <Link href="/update-user/123">Invalid user</Link>
        </li>
      </ul>
    </form>
  );
}
