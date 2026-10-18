import { Action } from "react-form-action/client";
import { subscribeAction } from "./action";
import { SubscribeForm } from "./form";

export default function Page() {
  return (
    <>
      <h1>Subscribe Form</h1>
      <Action action={subscribeAction} initialData={null}>
        <SubscribeForm />
      </Action>
    </>
  );
}
