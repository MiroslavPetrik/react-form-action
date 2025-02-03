"use server";

import { Action } from "react-form-action/client";
import { UpdateUserForm } from "./form";
import { updateUser } from "./action";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;
  const action = updateUser.bind(null, parseInt(userId));

  return (
    <Action action={action} initialData={{ name: "foo", userId: 0 }}>
      <UpdateUserForm />
    </Action>
  );
}
