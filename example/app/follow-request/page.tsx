import { Action } from "react-form-action/client";

import { followRequestAction } from "./action";
import { FollowRequestForm } from "./form";

export default function Page() {
  return (
    <>
      <h1>Follow request (Submit)</h1>
      <Action action={followRequestAction} initialData={null}>
        <FollowRequestForm />
      </Action>
    </>
  );
}
