"use server";

import { UpdateUserForm } from "./form";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <h1>User update (React)</h1>
      <UpdateUserForm userId={userId} />
    </>
  );
}
