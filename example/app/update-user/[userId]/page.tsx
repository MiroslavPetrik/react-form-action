"use server";

import Link from "next/link";
import { Action } from "react-form-action/client";
import { updateUser } from "./action";
import { UpdateUserForm } from "./form";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;
  const action = updateUser.bind(null, parseInt(userId));

  return (
    <>
      <h1>User update</h1>
      <Action action={action} initialData={{ name: "foo", userId: 0 }}>
        <UpdateUserForm />
      </Action>
      <aside>
        <nav>
          <ul>
            <li>
              <Link href="/update-user/9">Valid user</Link>
            </li>
            <li>
              <Link href="/update-user/123">Invalid user</Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
