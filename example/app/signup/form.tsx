"use client";

import { Form, createComponents } from "react-form-action/client";

import { signUpAction } from "./action";

// 🌟 The FieldError is now bound do the signUpAction input schema which allows autocompletion for its "name" prop
// ⚠️ Usable only with actions created with the formAction builder
const { FieldError } = createComponents(signUpAction);

export function SignUpForm() {
  return (
    <Form>
      {/* 1️⃣ Access nested fields by dot access notation: */}
      <FieldError name="user.email">
        {({ name, error }) => (
          <label>
            Email address
            <input name={name} aria-invalid={!!error} />
            {error && <small>{error}</small>}
          </label>
        )}
      </FieldError>
      {/* 2️⃣ Access fields by their name: */}
      <FieldError name="password">
        {({ name, error }) => (
          <label>
            Password
            <input name={name} aria-invalid={!!error} />
            {error && <small>{error}</small>}
          </label>
        )}
      </FieldError>
      <FieldError name="confirm">
        {({ name, error }) => (
          <label>
            Confirm password
            <input name={name} aria-invalid={!!error} />
            {error && <small>{error}</small>}
          </label>
        )}
      </FieldError>
      {/* 3️⃣ When the "name" prop is an empty string, the top-level error will be rendered e.g.:
          "Passwords don't match" */}
      <FieldError name="" />
      <button type="submit">Submit</button>
    </Form>
  );
}
