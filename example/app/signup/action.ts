"use server";

import { formAction } from "react-form-action";

import { signupSchema } from "./schema";

const emails = new Set();

export const signUpAction = formAction.input(signupSchema).run(
  async ({
    input: {
      user: { email },
    },
  }) => {
    if (emails.has(email)) {
      throw new Error("Already subscribed!");
    } else {
      emails.add(email);
    }

    return null;
  }
);
