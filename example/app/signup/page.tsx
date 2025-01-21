import { Action } from "react-form-action/client";
import { SignUpForm } from "./form";
import { signUpAction } from "./action";

export default function Page() {
  return (
    <Action action={signUpAction} initialData={null}>
      <SignUpForm />
    </Action>
  );
}
