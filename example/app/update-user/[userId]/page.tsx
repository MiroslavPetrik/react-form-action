"use server";

import { UpdateUserForm } from "./form";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function Page({ params }: Props) {
  const { userId } = await params;

  return <UpdateUserForm userId={userId} />;
}
