import { Action } from "react-form-action/client";
import { signUpAction } from "./action";
import { SignUpForm } from "./form";

export default function Page() {
  return (
    <>
      <h1>Signup Form</h1>
      <Action action={signUpAction}>
        <SignUpForm />
      </Action>
    </>
  );
}
