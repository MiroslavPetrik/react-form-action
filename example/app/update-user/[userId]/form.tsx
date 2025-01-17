"use client";

import { useActionState } from "react";
import { updateUser } from "./action";

type Props = {
  userId: string;
};

export function UpdateUserForm({ userId }: Props) {
  const action = updateUser.bind(null, userId);

  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction}>
      <input name="name" placeholder="Name" defaultValue="Jeff" />
      <button type="submit">{pending ? "submitting..." : "Submit"}</button>
      <p>{state?.userId ? `submitted with id ${state.userId}` : null}</p>
    </form>
  );
}
