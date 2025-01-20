"use client";

import Link from "next/link";
import { Form, useActionContext } from "react-form-action/client";
import { updateUser } from "./action";

// Drop the first arg, so it fits useAction hook
const hack = updateUser.bind(null, 0);

export function UpdateUserForm() {
  const { isSuccess, isFailure, data, error, isPending } =
    useActionContext(hack);

  return (
    <Form>
      <input name="name" placeholder="Name" defaultValue="Jeff" />
      <button type="submit">{isPending ? "submitting..." : "Submit"}</button>
      <p>
        {isSuccess ? `✅ Updated id ${data.userId}` : null}
        {isFailure ? `❌ ${error.message}` : null}
      </p>
      <ul>
        <li>
          <Link href="/update-user/9">Valid user</Link>
        </li>
        <li>
          <Link href="/update-user/123">Invalid user</Link>
        </li>
      </ul>
    </Form>
  );
}
