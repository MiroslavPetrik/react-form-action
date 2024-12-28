import { Action } from "react-form-action/client";
import { SubscribeForm } from "./form";
import { subscribeAction } from "./action";

export default function Page() {
  return (
    <Action action={subscribeAction} initialData={null}>
      <SubscribeForm />
    </Action>
  );
}
